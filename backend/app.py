from flask import Flask, jsonify
from flask_cors import CORS
from workers.queue import start_worker
from routes.statements import statements_bp
from routes.transactions import transactions_bp
from routes.insights import insights_bp
from routes.forecast import forecast_bp
from routes.anomalies import anomalies_bp
from routes.score import score_bp
from routes.rules import rules_bp
from routes.audit import audit_bp


def create_app():
    app = Flask(__name__)
    CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

    # Ensure CORS headers are on every response, including error responses
    @app.after_request
    def add_cors(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return response

    @app.errorhandler(Exception)
    def handle_exception(e):
        response = jsonify({"error": str(e)})
        response.status_code = 500
        return response

    start_worker()
    app.register_blueprint(statements_bp, url_prefix="/api/statements")
    app.register_blueprint(transactions_bp, url_prefix="/api/transactions")
    app.register_blueprint(insights_bp, url_prefix="/api/insights")
    app.register_blueprint(forecast_bp, url_prefix="/api/forecast")
    app.register_blueprint(anomalies_bp, url_prefix="/api/anomalies")
    app.register_blueprint(score_bp, url_prefix="/api/score")
    app.register_blueprint(rules_bp, url_prefix="/api/rules")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
