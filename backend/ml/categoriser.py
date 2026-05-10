import re
import joblib
import numpy as np
import os
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/categoriser.joblib")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "../models/label_encoder.joblib")

KEYWORDS = {
    "Food & Dining": [
        "swiggy",
        "zomato",
        "dominos",
        "mcdonalds",
        "kfc",
        "pizza",
        "burger",
        "restaurant",
        "cafe",
        "food",
        "dining",
        "eat",
        "biryani",
        "hotel",
    ],
    "Shopping": [
        "amazon",
        "flipkart",
        "myntra",
        "ajio",
        "meesho",
        "snapdeal",
        "nykaa",
        "mall",
        "store",
        "shop",
        "retail",
        "market",
    ],
    "Transport": [
        "uber",
        "ola",
        "rapido",
        "irctc",
        "railway",
        "bus",
        "metro",
        "petrol",
        "fuel",
        "auto",
        "cab",
        "ticket",
        "travel",
    ],
    "Utilities": [
        "electricity",
        "bescom",
        "torrent",
        "mseb",
        "water",
        "gas",
        "broadband",
        "internet",
        "airtel",
        "jio",
        "vodafone",
        "bsnl",
        "recharge",
        "postpaid",
        "prepaid",
    ],
    "Entertainment": [
        "netflix",
        "prime",
        "hotstar",
        "spotify",
        "youtube",
        "bookmyshow",
        "pvr",
        "inox",
        "gaming",
        "steam",
    ],
    "Healthcare": [
        "pharmacy",
        "medical",
        "hospital",
        "clinic",
        "doctor",
        "apollo",
        "medplus",
        "netmeds",
        "pharmeasy",
        "health",
        "lab",
        "diagnostic",
    ],
    "Education": [
        "udemy",
        "coursera",
        "college",
        "university",
        "school",
        "fees",
        "course",
        "book",
        "byju",
        "unacademy",
    ],
    "Finance": [
        "emi",
        "loan",
        "insurance",
        "lic",
        "premium",
        "sip",
        "mutual fund",
        "zerodha",
        "groww",
        "policy",
        "neft",
        "imps",
        "rtgs",
    ],
    "Groceries": [
        "dmart",
        "bigbasket",
        "blinkit",
        "grofers",
        "zepto",
        "reliance fresh",
        "more",
        "spencer",
        "supermarket",
        "grocery",
        "kirana",
    ],
    "Rent & Housing": [
        "rent",
        "maintenance",
        "society",
        "housing",
        "flat",
        "apartment",
        "landlord",
        "pg",
    ],
    "ATM & Cash": ["atm", "cash withdrawal", "cash deposit"],
    "Salary": ["salary", "payroll", "wages", "stipend", "income", "credited by"],
    "Transfers": [
        "upi",
        "neft",
        "imps",
        "transfer",
        "sent to",
        "received from",
        "google pay",
        "gpay",
        "phonepe",
        "paytm",
        "bhim",
    ],
}

TRAINING_DATA = [
    ("swiggy order food delivery", "Food & Dining"),
    ("zomato food order", "Food & Dining"),
    ("dominos pizza order", "Food & Dining"),
    ("restaurant bill payment", "Food & Dining"),
    ("amazon purchase online shopping", "Shopping"),
    ("flipkart order delivery", "Shopping"),
    ("myntra clothing purchase", "Shopping"),
    ("uber ride cab booking", "Transport"),
    ("ola cab ride", "Transport"),
    ("irctc train ticket booking", "Transport"),
    ("petrol pump fuel", "Transport"),
    ("electricity bill payment bescom", "Utilities"),
    ("airtel mobile recharge", "Utilities"),
    ("jio broadband internet bill", "Utilities"),
    ("netflix subscription streaming", "Entertainment"),
    ("spotify music subscription", "Entertainment"),
    ("bookmyshow movie ticket", "Entertainment"),
    ("apollo pharmacy medicine", "Healthcare"),
    ("hospital doctor consultation", "Healthcare"),
    ("medical lab test diagnostic", "Healthcare"),
    ("udemy course online learning", "Education"),
    ("college fees university payment", "Education"),
    ("emi loan repayment", "Finance"),
    ("lic insurance premium", "Finance"),
    ("sip mutual fund investment", "Finance"),
    ("dmart grocery shopping", "Groceries"),
    ("bigbasket grocery delivery", "Groceries"),
    ("zepto blinkit grocery", "Groceries"),
    ("rent payment flat", "Rent & Housing"),
    ("society maintenance charges", "Rent & Housing"),
    ("atm cash withdrawal", "ATM & Cash"),
    ("salary credit payroll", "Salary"),
    ("upi transfer payment", "Transfers"),
    ("neft transfer bank", "Transfers"),
    ("phonepe gpay paytm transfer", "Transfers"),
]


def keyword_match(description):
    desc_lower = description.lower()
    for category, keywords in KEYWORDS.items():
        for kw in keywords:
            if kw in desc_lower:
                return category
    return None


def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def load_or_train_model():
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        model = joblib.load(MODEL_PATH)
        encoder = joblib.load(ENCODER_PATH)
        return model, encoder

    return train_model(TRAINING_DATA)


def train_model(data):
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    texts = [clean_text(t) for t, _ in data]
    labels = [l for _, l in data]

    encoder = LabelEncoder()
    y = encoder.fit_transform(labels)

    model = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
            ("clf", LogisticRegression(max_iter=1000, C=5.0)),
        ]
    )
    model.fit(texts, y)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)

    return model, encoder


def categorise_transactions(transactions):
    model, encoder = load_or_train_model()
    results = []

    for txn in transactions:
        description = txn.get("description", "")

        # Stage 1: keyword override
        keyword_cat = keyword_match(description)
        if keyword_cat:
            results.append(
                {
                    **txn,
                    "category": keyword_cat,
                    "confidence": 1.0,
                    "category_source": "keyword",
                }
            )
            continue

        # Stage 2: ML model
        cleaned = clean_text(description)
        probs = model.predict_proba([cleaned])[0]
        max_prob = float(np.max(probs))
        pred_index = int(np.argmax(probs))
        category = encoder.inverse_transform([pred_index])[0]

        # Stage 3: confidence threshold
        if max_prob < 0.65:
            category = "Uncategorised"

        results.append(
            {
                **txn,
                "category": category,
                "confidence": round(max_prob, 4),
                "category_source": "ml_model",
            }
        )

    return results


def retrain_with_correction(description, correct_category):
    model, encoder = load_or_train_model()

    new_samples = [(description, correct_category)] * 3
    all_data = TRAINING_DATA + new_samples

    return train_model(all_data)
