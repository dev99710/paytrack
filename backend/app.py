from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import JWT_SECRET
from workers.queue import start_worker
from routes.auth import auth_bp
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
    app.config["JWT_SECRET_KEY"] = JWT_SECRET
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    start_worker()
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
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
