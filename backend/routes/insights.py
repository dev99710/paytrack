from flask import Blueprint, request, jsonify
from db import supabase
from ml.clustering import cluster_merchants
from collections import defaultdict
from config import DEV_USER_ID

insights_bp = Blueprint("insights", __name__)


@insights_bp.route("/monthly-summary", methods=["GET"])
def monthly_summary():
    user_id = DEV_USER_ID
    result = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    txns = result.data or []

    monthly = defaultdict(
        lambda: {"income": 0, "expense": 0, "net": 0, "categories": defaultdict(float)}
    )
    category_totals = defaultdict(float)
    total_income = 0
    total_expense = 0

    for t in txns:
        month = t["date"][:7]
        if t["type"] == "credit":
            monthly[month]["income"] += t["amount"]
            total_income += t["amount"]
        else:
            monthly[month]["expense"] += t["amount"]
            monthly[month]["categories"][t.get("category", "Uncategorised")] += t["amount"]
            category_totals[t.get("category", "Uncategorised")] += t["amount"]
            total_expense += t["amount"]
        monthly[month]["net"] = monthly[month]["income"] - monthly[month]["expense"]

    monthly_breakdown = []
    for month, data in sorted(monthly.items(), reverse=True):
        monthly_breakdown.append(
            {
                "month": month,
                "income": round(data["income"], 2),
                "expense": round(data["expense"], 2),
                "net": round(data["net"], 2),
            }
        )

    return jsonify({
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "monthly_breakdown": monthly_breakdown,
        "category_breakdown": {k: round(v, 2) for k, v in category_totals.items()},
    }), 200


@insights_bp.route("/merchants", methods=["GET"])
def merchants():
    user_id = DEV_USER_ID
    result = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    txns = result.data or []
    clusters = cluster_merchants(txns)
    return jsonify(clusters), 200
