from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import supabase

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/", methods=["GET"])
@jwt_required()
def get_audit():
    user_id = get_jwt_identity()
    action = request.args.get("action")
    limit = int(request.args.get("limit", 50))

    query = supabase.table("audit_log").select("*").eq("user_id", user_id)
    if action:
        query = query.eq("action", action)

    result = query.order("created_at", desc=True).limit(limit).execute()
    return jsonify(result.data), 200
