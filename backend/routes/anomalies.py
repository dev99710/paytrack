from flask import Blueprint, request, jsonify
from db import supabase
from config import DEV_USER_ID

anomalies_bp = Blueprint("anomalies", __name__)


@anomalies_bp.route("/", methods=["GET"])
def get_anomalies():
    user_id = DEV_USER_ID
    severity = request.args.get("severity")

    query = (
        supabase.table("anomalies")
        .select("*, transactions(date, description, amount, category)")
        .eq("user_id", user_id)
    )
    if severity:
        query = query.eq("severity", severity)

    result = query.order("created_at", desc=True).execute()
    return jsonify(result.data), 200
