from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import supabase
from ml.categoriser import retrain_with_correction

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/", methods=["GET"])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    category = request.args.get("category")
    txn_type = request.args.get("type")
    limit = int(request.args.get("limit", 100))

    query = supabase.table("transactions").select("*").eq("user_id", user_id)
    if category:
        query = query.eq("category", category)
    if txn_type:
        query = query.eq("type", txn_type)

    result = query.order("date", desc=True).limit(limit).execute()
    return jsonify(result.data), 200


@transactions_bp.route("/<txn_id>/category", methods=["PATCH"])
@jwt_required()
def update_category(txn_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    new_cat = data.get("category")

    if not new_cat:
        return jsonify({"error": "category required"}), 400

    txn = (
        supabase.table("transactions")
        .select("*")
        .eq("id", txn_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not txn.data:
        return jsonify({"error": "Transaction not found"}), 404

    old_cat = txn.data[0]["category"]
    desc = txn.data[0]["description"]

    supabase.table("transactions").update(
        {"category": new_cat, "category_source": "user"}
    ).eq("id", txn_id).execute()

    retrain_with_correction(desc, new_cat)

    supabase.table("audit_log").insert(
        {
            "user_id": user_id,
            "entity_type": "transaction",
            "entity_id": txn_id,
            "action": "category_corrected",
            "details": {"old": old_cat, "new": new_cat, "description": desc},
            "source": "user",
        }
    ).execute()

    return jsonify({"message": "Category updated and model retrained"}), 200
