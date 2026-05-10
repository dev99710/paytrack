from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import supabase

anomalies_bp = Blueprint("anomalies", __name__)


@anomalies_bp.route("/", methods=["GET"])
@jwt_required()
def get_anomalies():
    user_id = get_jwt_identity()
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
