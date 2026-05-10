from collections import defaultdict
import numpy as np

GRADE_THRESHOLDS = [(80, "A"), (65, "B"), (50, "C"), (35, "D"), (0, "F")]


def calculate_score(transactions):
    if not transactions:
        return {"score": 0, "grade": "F", "breakdown": {}, "insights": []}

    total_income = sum(t["amount"] for t in transactions if t.get("type") == "credit")
    total_expense = sum(t["amount"] for t in transactions if t.get("type") == "debit")

    if total_income == 0:
        return {
            "score": 0,
            "grade": "F",
            "breakdown": {},
            "insights": ["No income detected"],
        }

    # Signal 1 — Savings Rate (30%)
    savings_rate = (total_income - total_expense) / total_income
    savings_score = min(100, max(0, savings_rate / 0.30 * 100))

    # Signal 2 — Expense Volatility (20%)
    monthly_expense = defaultdict(float)
    for t in transactions:
        if t.get("type") == "debit":
            month = t.get("date", "")[:7]
            monthly_expense[month] += t["amount"]

    if len(monthly_expense) > 1:
        vals = list(monthly_expense.values())
        cv = np.std(vals) / np.mean(vals) if np.mean(vals) > 0 else 1
        volatility_score = max(0, 100 - cv * 100)
    else:
        volatility_score = 50

    # Signal 3 — Anomaly Burden (20%)
    from ml.anomaly import detect_anomalies

    anomalies = detect_anomalies(transactions)
    anomaly_score = max(0, 100 - len(anomalies) * 15)

    # Signal 4 — Subscription Load (15%)
    sub_spend = sum(
        t["amount"]
        for t in transactions
        if t.get("type") == "debit" and t.get("category") == "Entertainment"
    )
    sub_pct = sub_spend / total_expense if total_expense > 0 else 0
    subscription_score = max(0, 100 - (sub_pct / 0.05) * 100) if sub_pct > 0.05 else 100

    # Signal 5 — Impulse Control (15%)
    impulse_cats = {"Food & Dining", "Shopping", "Entertainment"}
    impulse_spend = sum(
        t["amount"]
        for t in transactions
        if t.get("type") == "debit" and t.get("category") in impulse_cats
    )
    impulse_pct = impulse_spend / total_expense if total_expense > 0 else 0
    impulse_score = (
        max(0, 100 - (impulse_pct / 0.20) * 100) if impulse_pct > 0.20 else 100
    )

    # Weighted total
    score = (
        savings_score * 0.30
        + volatility_score * 0.20
        + anomaly_score * 0.20
        + subscription_score * 0.15
        + impulse_score * 0.15
    )
    score = round(min(100, max(0, score)), 1)

    grade = next(g for threshold, g in GRADE_THRESHOLDS if score >= threshold)

    breakdown = {
        "savings_rate": round(savings_rate * 100, 1),
        "savings_score": round(savings_score, 1),
        "volatility_score": round(volatility_score, 1),
        "anomaly_score": round(anomaly_score, 1),
        "subscription_score": round(subscription_score, 1),
        "impulse_score": round(impulse_score, 1),
    }

    insights = []
    if savings_rate < 0.10:
        insights.append("Savings rate below 10% — reduce discretionary spending")
    if impulse_pct > 0.30:
        insights.append("Over 30% spent on food, shopping & entertainment")
    if len(anomalies) > 3:
        insights.append(
            f"{len(anomalies)} anomalous transactions detected — review them"
        )
    if sub_pct > 0.10:
        insights.append("High subscription load — audit recurring payments")
    if not insights:
        insights.append("Financial health looks good — keep it up")

    return {
        "score": score,
        "grade": grade,
        "breakdown": breakdown,
        "insights": insights,
    }
