from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import supabase
from ml.forecaster import forecast_spending

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.route("/", methods=["GET"])
@jwt_required()
def forecast():
    user_id = get_jwt_identity()
    category = request.args.get("category")
    months = int(request.args.get("months", 3))

    result = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    txns = result.data or []

    forecasts = forecast_spending(txns, months_ahead=months)

    if category:
        return jsonify({category: forecasts.get(category, [])}), 200
    return jsonify(forecasts), 200
