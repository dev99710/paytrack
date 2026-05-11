from flask import Blueprint, request, jsonify
from db import supabase
import uuid
from config import DEV_USER_ID

rules_bp = Blueprint("rules", __name__)


@rules_bp.route("/", methods=["GET"])
def get_rules():
    user_id = DEV_USER_ID
    result = (
        supabase.table("rules")
        .select("*")
        .eq("user_id", user_id)
        .order("priority", desc=True)
        .execute()
    )
    return jsonify(result.data), 200


@rules_bp.route("/", methods=["POST"])
def create_rule():
    user_id = DEV_USER_ID
    data = request.get_json()
    result = (
        supabase.table("rules")
        .insert(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": data.get("name"),
                "conditions": data.get("conditions", []),
                "actions": data.get("actions", []),
                "priority": data.get("priority", 0),
                "is_active": True,
            }
        )
        .execute()
    )
    return jsonify(result.data[0]), 201


@rules_bp.route("/<rule_id>", methods=["PATCH"])
def update_rule(rule_id):
    user_id = DEV_USER_ID
    data = request.get_json()
    result = (
        supabase.table("rules")
        .update(data)
        .eq("id", rule_id)
        .eq("user_id", user_id)
        .execute()
    )
    return jsonify(result.data[0]), 200


@rules_bp.route("/<rule_id>", methods=["DELETE"])
def delete_rule(rule_id):
    user_id = DEV_USER_ID
    supabase.table("rules").delete().eq("id", rule_id).eq("user_id", user_id).execute()
    return jsonify({"message": "Rule deleted"}), 200
