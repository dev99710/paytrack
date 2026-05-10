import sqlite3
import json
import threading
import time
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "queue.db")


def init_queue():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            status TEXT DEFAULT 'pending',
            payload TEXT,
            result TEXT,
            error TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def enqueue(job_id, payload):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO jobs (id, status, payload) VALUES (?, 'pending', ?)",
        (job_id, json.dumps(payload)),
    )
    conn.commit()
    conn.close()


def get_job(job_id):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT id, status, result, error FROM jobs WHERE id = ?", (job_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row[0],
        "status": row[1],
        "result": json.loads(row[2]) if row[2] else None,
        "error": row[3],
    }


def update_job(job_id, status, result=None, error=None):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE jobs SET status=?, result=?, error=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (status, json.dumps(result) if result else None, error, job_id),
    )
    conn.commit()
    conn.close()


def process_job(job_id, payload):
    try:
        from utils.parser import parse_statement
        from ml.categoriser import categorise_transactions
        from ml.rule_engine import apply_rules
        from ml.anomaly import detect_anomalies
        from ml.clustering import cluster_merchants
        from ml.scorer import calculate_score
        from db import supabase

        update_job(job_id, "processing")

        user_id = payload["user_id"]
        statement_id = payload["statement_id"]
        file_bytes = bytes(payload["file_bytes"])
        filename = payload["filename"]

        # Layer 1 — Parse
        transactions, bank = parse_statement(file_bytes, filename)
        if not transactions:
            update_job(job_id, "failed", error="No transactions found in file")
            return

        # Layer 2 — ML Categorise
        transactions = categorise_transactions(transactions)

        # Layer 3 — Rule Engine
        transactions = apply_rules(transactions, user_id)

        # Layer 4 — Anomaly Detection
        anomaly_results = detect_anomalies(transactions)
        anomaly_map = {a["transaction"]["description"][:30]: a for a in anomaly_results}

        # Layer 5 — Clustering (stored in result, not DB)
        clusters = cluster_merchants(transactions)

        # Layer 6 — Score
        score_result = calculate_score(transactions)

        # Write transactions to Supabase
        txn_rows = []
        for txn in transactions:
            txn_rows.append(
                {
                    "statement_id": statement_id,
                    "user_id": user_id,
                    "date": txn["date"],
                    "description": txn["description"],
                    "amount": txn["amount"],
                    "type": txn["type"],
                    "balance": txn.get("balance", 0),
                    "category": txn.get("category", "Uncategorised"),
                    "confidence": txn.get("confidence", 0),
                    "category_source": txn.get("category_source", "ml_model"),
                    "tags": txn.get("tags", []),
                    "flags": txn.get("flags", []),
                    "risk_score": txn.get("risk_score", 0),
                }
            )

        supabase.table("transactions").insert(txn_rows).execute()

        # Write anomalies
        for a in anomaly_results:
            txn_desc = a["transaction"]["description"]
            txn_row = (
                supabase.table("transactions")
                .select("id")
                .eq("statement_id", statement_id)
                .eq("description", txn_desc)
                .limit(1)
                .execute()
            )

            if txn_row.data:
                supabase.table("anomalies").insert(
                    {
                        "transaction_id": txn_row.data[0]["id"],
                        "user_id": user_id,
                        "reasons": a["reasons"],
                        "severity": a["severity"],
                    }
                ).execute()

        # Write score
        supabase.table("scores").insert(
            {
                "user_id": user_id,
                "score": score_result["score"],
                "grade": score_result["grade"],
                "breakdown": score_result["breakdown"],
                "insights": score_result["insights"],
            }
        ).execute()

        # Update statement status
        supabase.table("statements").update(
            {"status": "processed", "txn_count": len(transactions), "bank": bank}
        ).eq("id", statement_id).execute()

        # Audit log
        supabase.table("audit_log").insert(
            {
                "user_id": user_id,
                "entity_type": "statement",
                "entity_id": statement_id,
                "action": "processed",
                "details": {
                    "txn_count": len(transactions),
                    "score": score_result["score"],
                    "anomalies": len(anomaly_results),
                },
                "source": "pipeline",
            }
        ).execute()

        update_job(
            job_id,
            "done",
            result={
                "txn_count": len(transactions),
                "anomalies": len(anomaly_results),
                "score": score_result["score"],
                "grade": score_result["grade"],
                "clusters": clusters[:10],
            },
        )

    except Exception as e:
        update_job(job_id, "failed", error=str(e))
        try:
            from db import supabase

            supabase.table("statements").update({"status": "failed"}).eq(
                "id", payload.get("statement_id", "")
            ).execute()
        except:
            pass


def start_worker():
    init_queue()

    def worker_loop():
        while True:
            try:
                conn = sqlite3.connect(DB_PATH)
                row = conn.execute(
                    "SELECT id, payload FROM jobs WHERE status='pending' ORDER BY created_at LIMIT 1"
                ).fetchone()
                conn.close()

                if row:
                    job_id = row[0]
                    payload = json.loads(row[1])
                    threading.Thread(
                        target=process_job, args=(job_id, payload), daemon=True
                    ).start()

            except Exception as e:
                print(f"Worker error: {e}")

            time.sleep(3)

    thread = threading.Thread(target=worker_loop, daemon=True)
    thread.start()
    print("Queue worker started")
