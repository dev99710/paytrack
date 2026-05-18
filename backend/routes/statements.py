from flask import Blueprint, request, jsonify
import uuid
from db import supabase
from workers.queue import enqueue, get_job
from config import DEV_USER_ID

statements_bp = Blueprint("statements", __name__)


@statements_bp.route("/upload", methods=["POST"])
def upload():
    user_id = DEV_USER_ID

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    filename = file.filename

    if not filename.endswith((".pdf", ".csv")):
        return jsonify({"error": "Only PDF and CSV files supported"}), 400

    file_bytes = list(file.read())

    statement_id = str(uuid.uuid4())
    try:
        supabase.table("statements").insert(
            {"id": statement_id, "user_id": user_id, "status": "pending"}
        ).execute()
    except Exception as e:
        return jsonify({"error": f"Database unavailable: {str(e)[:120]}"}), 503

    job_id = str(uuid.uuid4())
    enqueue(
        job_id,
        {
            "user_id": user_id,
            "statement_id": statement_id,
            "file_bytes": file_bytes,
            "filename": filename,
        },
    )

    return jsonify({"job_id": job_id, "statement_id": statement_id}), 202


@statements_bp.route("/job/<job_id>", methods=["GET"])
def job_status(job_id):
    job = get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job), 200
