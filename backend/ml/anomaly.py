import numpy as np


def detect_anomalies(transactions):
    anomalies = []
    debits = [t["amount"] for t in transactions if t.get("type") == "debit"]

    if len(debits) >= 3:
        mean = np.mean(debits)
        std = np.std(debits)
        threshold = mean + 3 * std
    else:
        threshold = float("inf")

    # Per-category averages
    category_amounts = {}
    for t in transactions:
        cat = t.get("category", "Uncategorised")
        category_amounts.setdefault(cat, []).append(t["amount"])
    category_avg = {cat: np.mean(vals) for cat, vals in category_amounts.items()}

    # Amount+date duplicate tracking
    seen = {}

    for txn in transactions:
        reasons = []
        severity = None
        amount = txn.get("amount", 0)
        desc = txn.get("description", "").lower()
        cat = txn.get("category", "Uncategorised")
        date = txn.get("date", "")
        txn_type = txn.get("type", "")

        # Rule 1 — statistical outlier
        if txn_type == "debit" and amount > threshold:
            reasons.append(
                f"Amount ₹{amount:,.0f} exceeds 3× std above mean (threshold ₹{threshold:,.0f})"
            )
            severity = "high"

        # Rule 2 — large unknown transaction
        if amount > 10000 and cat == "Uncategorised":
            reasons.append(f"Large unidentified transaction of ₹{amount:,.0f}")
            severity = "high"

        # Rule 3 — category spike
        cat_avg = category_avg.get(cat, 0)
        if cat_avg > 0 and amount > 3 * cat_avg and amount > 1000:
            reasons.append(
                f"₹{amount:,.0f} is 3× above average for {cat} (avg ₹{cat_avg:,.0f})"
            )
            if not severity:
                severity = "medium"

        # Rule 4 — round number UPI
        if amount >= 5000 and amount % 1000 == 0 and "upi" in desc:
            reasons.append(f"Round UPI transfer of ₹{amount:,.0f}")
            if not severity:
                severity = "medium"

        # Rule 5 — duplicate detection (same amount within 2 days)
        key = f"{amount}_{desc[:20]}"
        if key in seen:
            reasons.append(
                f"Possible duplicate: same amount and merchant within 2 days"
            )
            if not severity:
                severity = "medium"
        seen[key] = date

        if reasons:
            anomalies.append(
                {"transaction": txn, "reasons": reasons, "severity": severity}
            )

    return anomalies
