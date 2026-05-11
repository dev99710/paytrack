from flask import Blueprint, jsonify
from db import supabase
from config import DEV_USER_ID

score_bp = Blueprint("score", __name__)


@score_bp.route("/", methods=["GET"])
def get_score():
    user_id = DEV_USER_ID
    result = (
        supabase.table("scores")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return jsonify({"error": "No score yet — upload a statement first"}), 404
    return jsonify(result.data[0]), 200


@score_bp.route("/history", methods=["GET"])
def score_history():
    user_id = DEV_USER_ID
    result = (
        supabase.table("scores")
        .select("score, grade, created_at")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return jsonify(result.data), 200
