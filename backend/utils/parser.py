import pdfplumber
import pandas as pd
from dateutil import parser as date_parser
import re
import io

BANK_CONFIGS = {
    "sbi": {
        "keywords": ["state bank", "sbi"],
        "columns": {
            "date": ["date", "txn date", "value date"],
            "description": ["description", "narration", "particulars"],
            "debit": ["debit", "withdrawal", "withdrawal amt"],
            "credit": ["credit", "deposit", "deposit amt"],
            "balance": ["balance"],
        },
    },
    "hdfc": {
        "keywords": ["hdfc bank", "hdfc"],
        "columns": {
            "date": ["date"],
            "description": ["narration", "description"],
            "debit": ["withdrawal amt", "debit"],
            "credit": ["deposit amt", "credit"],
            "balance": ["closing balance", "balance"],
        },
    },
    "icici": {
        "keywords": ["icici bank", "icici"],
        "columns": {
            "date": ["value date", "date"],
            "description": ["transaction remarks", "description", "narration"],
            "debit": ["withdrawal (dr)", "debit"],
            "credit": ["deposit (cr)", "credit"],
            "balance": ["balance"],
        },
    },
    "kotak": {
        "keywords": ["kotak mahindra", "kotak bank", "kotak"],
        "columns": {
            "date": ["value date", "date"],
            "description": ["description", "narration"],
            "debit": ["debit", "dr"],
            "credit": ["credit", "cr"],
            "balance": ["balance"],
        },
    },
}


def detect_bank(text):
    text_lower = text.lower()
    for bank, config in BANK_CONFIGS.items():
        if any(kw in text_lower for kw in config["keywords"]):
            return bank
    return "generic"


def parse_amount(val):
    if pd.isna(val) or val == "" or val is None:
        return 0.0
    val = str(val).replace(",", "").replace("₹", "").replace("INR", "").strip()
    val = re.sub(r"[^\d.]", "", val)
    try:
        return float(val)
    except:
        return 0.0


def parse_date(val):
    try:
        return date_parser.parse(str(val), dayfirst=True).date().isoformat()
    except:
        return None


def match_column(df_cols, candidates):
    df_cols_lower = [c.lower().strip() for c in df_cols]
    for candidate in candidates:
        for i, col in enumerate(df_cols_lower):
            if candidate in col:
                return df_cols[i]
    return None


def normalise_df(df, bank):
    config = BANK_CONFIGS.get(bank, BANK_CONFIGS["sbi"])["columns"]
    mapping = {}
    for field, candidates in config.items():
        matched = match_column(list(df.columns), candidates)
        if matched:
            mapping[field] = matched

    rows = []
    for _, row in df.iterrows():
        date = parse_date(row.get(mapping.get("date", ""), ""))
        if not date:
            continue

        description = str(row.get(mapping.get("description", ""), "")).strip()
        if not description or description.lower() in ["nan", ""]:
            continue

        debit = parse_amount(row.get(mapping.get("debit", ""), 0))
        credit = parse_amount(row.get(mapping.get("credit", ""), 0))
        balance = parse_amount(row.get(mapping.get("balance", ""), 0))

        if debit > 0:
            amount = debit
            txn_type = "debit"
        elif credit > 0:
            amount = credit
            txn_type = "credit"
        else:
            continue

        rows.append(
            {
                "date": date,
                "description": description,
                "amount": amount,
                "type": txn_type,
                "balance": balance,
            }
        )

    return rows


def parse_pdf(file_bytes):
    transactions = []
    full_text = ""

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            full_text += page.extract_text() or ""

        bank = detect_bank(full_text)

        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                df = pd.DataFrame(table[1:], columns=table[0])
                df.columns = [
                    str(c).strip() if c else f"col_{i}"
                    for i, c in enumerate(df.columns)
                ]
                rows = normalise_df(df, bank)
                transactions.extend(rows)

    return transactions, bank


def parse_csv(file_bytes):
    text = file_bytes.decode("utf-8", errors="ignore")
    full_text = text[:500]
    bank = detect_bank(full_text)

    df = pd.read_csv(io.StringIO(text), skiprows=0, on_bad_lines="skip")
    df.columns = [str(c).strip() for c in df.columns]

    transactions = normalise_df(df, bank)
    return transactions, bank


def parse_statement(file_bytes, filename):
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        return parse_pdf(file_bytes)
    elif filename_lower.endswith(".csv"):
        return parse_csv(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}")
