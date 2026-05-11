from flask import Blueprint, request, jsonify
from db import supabase
from ml.forecaster import forecast_spending
from config import DEV_USER_ID

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.route("/", methods=["GET"])
def forecast():
    user_id = DEV_USER_ID
    category = request.args.get("category")
    months = int(request.args.get("months", 3))

    result = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    txns = result.data or []

    forecasts = forecast_spending(txns, months_ahead=months)

    if category:
        return jsonify({category: forecasts.get(category, [])}), 200
    return jsonify(forecasts), 200
