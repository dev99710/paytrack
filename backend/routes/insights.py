from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import supabase
from ml.clustering import cluster_merchants
from collections import defaultdict

insights_bp = Blueprint("insights", __name__)


@insights_bp.route("/monthly-summary", methods=["GET"])
@jwt_required()
def monthly_summary():
    user_id = get_jwt_identity()
    result = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    txns = result.data or []

    monthly = defaultdict(
        lambda: {"income": 0, "expense": 0, "net": 0, "categories": defaultdict(float)}
    )
    for t in txns:
        month = t["date"][:7]
        if t["type"] == "credit":
            monthly[month]["income"] += t["amount"]
        else:
            monthly[month]["expense"] += t["amount"]
            monthly[month]["categories"][t.get("category", "Uncategorised")] += t[
                "amount"
            ]
        monthly[month]["net"] = monthly[month]["income"] - monthly[month]["expense"]

    summary = []
    for month, data in sorted(monthly.items(), reverse=True):
        summary.append(
            {
                "month": month,
                "income": round(data["income"], 2),
                "expense": round(data["expense"], 2),
                "net": round(data["net"], 2),
                "categories": dict(data["categories"]),
            }
        )

    return jsonify(summary), 200


@insights_bp.route("/merchants", methods=["GET"])
@jwt_required()
def merchants():
    user_id = get_jwt_identity()
    result = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    txns = result.data or []
    clusters = cluster_merchants(txns)
    return jsonify(clusters), 200
