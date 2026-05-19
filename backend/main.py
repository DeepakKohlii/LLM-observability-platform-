from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import datetime
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = "logs.db"

def init_db():
    conn = sqlite3.connect(DB)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS llm_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            function TEXT,
            model TEXT,
            prompt TEXT,
            response TEXT,
            input_tokens INTEGER,
            output_tokens INTEGER,
            latency_ms INTEGER,
            cost_usd REAL,
            error TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

class LogEntry(BaseModel):
    timestamp: str
    function: str
    model: str
    prompt: str
    response: str
    input_tokens: int
    output_tokens: int
    latency_ms: int
    cost_usd: float
    error: Optional[str] = None

@app.post("/log")
def log_entry(entry: LogEntry):
    conn = sqlite3.connect(DB)
    conn.execute("""
        INSERT INTO llm_logs
        (timestamp, function, model, prompt, response,
         input_tokens, output_tokens, latency_ms, cost_usd, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        entry.timestamp, entry.function, entry.model,
        entry.prompt, entry.response, entry.input_tokens,
        entry.output_tokens, entry.latency_ms,
        entry.cost_usd, entry.error
    ))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/stats")
def get_stats():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row

    total = conn.execute("SELECT COUNT(*) as n FROM llm_logs").fetchone()["n"]
    cost = conn.execute("SELECT SUM(cost_usd) as c FROM llm_logs").fetchone()["c"] or 0
    avg_lat = conn.execute("SELECT AVG(latency_ms) as l FROM llm_logs").fetchone()["l"] or 0
    errors = conn.execute("SELECT COUNT(*) as e FROM llm_logs WHERE error IS NOT NULL").fetchone()["e"]

    daily = conn.execute("""
        SELECT DATE(timestamp) as day,
               SUM(cost_usd) as cost,
               AVG(latency_ms) as avg_latency,
               COUNT(*) as calls
        FROM llm_logs
        GROUP BY day ORDER BY day DESC LIMIT 30
    """).fetchall()

    recent = conn.execute("""
        SELECT timestamp, model, prompt, response,
               latency_ms, cost_usd, error
        FROM llm_logs ORDER BY id DESC LIMIT 20
    """).fetchall()

    conn.close()

    return {
        "total_calls": total,
        "total_cost_usd": round(cost, 4),
        "avg_latency_ms": round(avg_lat),
        "error_count": errors,
        "daily": [dict(r) for r in daily],
        "recent_traces": [dict(r) for r in recent],
    }