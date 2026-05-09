from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
from db import supabase

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    existing = supabase.table("users").select("id").eq("email", email).execute()
    if existing.data:
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    result = (
        supabase.table("users")
        .insert({"email": email, "password_hash": password_hash, "name": name})
        .execute()
    )

    user = result.data[0]
    token = create_access_token(identity=user["id"])
    return jsonify(
        {"token": token, "user": {"id": user["id"], "email": email, "name": name}}
    ), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    result = supabase.table("users").select("*").eq("email", email).execute()
    if not result.data:
        return jsonify({"error": "Invalid credentials"}), 401

    user = result.data[0]
    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=user["id"])
    return jsonify(
        {
            "token": token,
            "user": {"id": user["id"], "email": email, "name": user["name"]},
        }
    ), 200
