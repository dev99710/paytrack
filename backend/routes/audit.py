from flask import Blueprint, request, jsonify
from db import supabase
from config import DEV_USER_ID

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/", methods=["GET"])
def get_audit():
    user_id = DEV_USER_ID
    action = request.args.get("action")
    limit = int(request.args.get("limit", 50))

    query = supabase.table("audit_log").select("*").eq("user_id", user_id)
    if action:
        query = query.eq("action", action)

    result = query.order("created_at", desc=True).limit(limit).execute()
    return jsonify(result.data), 200
