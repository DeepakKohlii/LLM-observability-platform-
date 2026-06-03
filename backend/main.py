from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import datetime
import time
import httpx
import os
from pathlib import Path
from typing import Optional, Literal
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = "logs.db"
GUEST_LIMIT = 5
GUEST_MODEL = "openai/gpt-4o-mini"

PROVIDER_BASE_URLS = {
    "openai": "https://api.openai.com/v1",
    "openrouter": "https://openrouter.ai/api/v1",
    "groq": "https://api.groq.com/openai/v1",
    "anthropic": "https://api.anthropic.com/v1",
}

COST_PER_1K_TOKENS = {
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "claude-sonnet-4-20250514": {"input": 0.003, "output": 0.015},
    "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
    "llama-3.3-70b-versatile": {"input": 0.00059, "output": 0.00079},
}


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
            error TEXT,
            guest_id TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS guest_sessions (
            guest_id TEXT PRIMARY KEY,
            calls_used INTEGER DEFAULT 0,
            created_at TEXT
        )
    """)
    try:
        conn.execute("ALTER TABLE llm_logs ADD COLUMN guest_id TEXT")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()


init_db()


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    key = model.split("/")[-1] if "/" in model else model
    pricing = COST_PER_1K_TOKENS.get(key, {"input": 0.001, "output": 0.002})
    return (input_tokens / 1000 * pricing["input"]) + (
        output_tokens / 1000 * pricing["output"]
    )


def save_log(
    *,
    model: str,
    prompt: str,
    response: str,
    input_tokens: int,
    output_tokens: int,
    latency_ms: int,
    cost_usd: float,
    error: Optional[str] = None,
    function: str = "chat",
    guest_id: Optional[str] = None,
):
    conn = sqlite3.connect(DB)
    conn.execute(
        """
        INSERT INTO llm_logs
        (timestamp, function, model, prompt, response,
         input_tokens, output_tokens, latency_ms, cost_usd, error, guest_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            datetime.datetime.now(datetime.timezone.utc).isoformat(),
            function,
            model,
            prompt,
            response,
            input_tokens,
            output_tokens,
            latency_ms,
            cost_usd,
            error,
            guest_id,
        ),
    )
    conn.commit()
    conn.close()


def get_guest_calls_used(guest_id: str) -> int:
    conn = sqlite3.connect(DB)
    row = conn.execute(
        "SELECT calls_used FROM guest_sessions WHERE guest_id = ?",
        (guest_id,),
    ).fetchone()
    conn.close()
    return row[0] if row else 0


def increment_guest_calls(guest_id: str) -> int:
    conn = sqlite3.connect(DB)
    row = conn.execute(
        "SELECT calls_used FROM guest_sessions WHERE guest_id = ?",
        (guest_id,),
    ).fetchone()
    if row:
        used = row[0] + 1
        conn.execute(
            "UPDATE guest_sessions SET calls_used = ? WHERE guest_id = ?",
            (used, guest_id),
        )
    else:
        used = 1
        conn.execute(
            "INSERT INTO guest_sessions (guest_id, calls_used, created_at) VALUES (?, ?, ?)",
            (
                guest_id,
                used,
                datetime.datetime.now(datetime.timezone.utc).isoformat(),
            ),
        )
    conn.commit()
    conn.close()
    return used


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


class ChatRequest(BaseModel):
    provider: Literal["openai", "openrouter", "groq", "anthropic", "custom"]
    api_key: str
    model: str
    prompt: str
    custom_base_url: Optional[str] = None


class GuestChatRequest(BaseModel):
    guest_id: str
    prompt: str


def call_openai_compatible(
    base_url: str, api_key: str, model: str, prompt: str, provider: str
) -> dict:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if provider == "openrouter":
        headers["HTTP-Referer"] = "http://localhost:5173"
        headers["X-Title"] = "LLM Observe"

    url = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
    }

    response = httpx.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    data = response.json()

    usage = data.get("usage") or {}
    content = ""
    choices = data.get("choices") or []
    if choices:
        content = choices[0].get("message", {}).get("content") or ""

    return {
        "response": content,
        "model": data.get("model") or model,
        "input_tokens": usage.get("prompt_tokens") or 0,
        "output_tokens": usage.get("completion_tokens") or 0,
    }


def call_anthropic(api_key: str, model: str, prompt: str) -> dict:
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": prompt}],
    }

    response = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers=headers,
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    data = response.json()

    usage = data.get("usage") or {}
    content = ""
    content_blocks = data.get("content") or []
    if content_blocks:
        content = content_blocks[0].get("text") or ""

    return {
        "response": content,
        "model": data.get("model") or model,
        "input_tokens": usage.get("input_tokens") or 0,
        "output_tokens": usage.get("output_tokens") or 0,
    }


def build_stats(conn: sqlite3.Connection, guest_id: Optional[str] = None) -> dict:
    conn.row_factory = sqlite3.Row
    where = "WHERE guest_id = ?" if guest_id else ""
    params: tuple = (guest_id,) if guest_id else ()

    total = conn.execute(
        f"SELECT COUNT(*) as n FROM llm_logs {where}", params
    ).fetchone()["n"]
    cost = (
        conn.execute(
            f"SELECT SUM(cost_usd) as c FROM llm_logs {where}", params
        ).fetchone()["c"]
        or 0
    )
    avg_lat = (
        conn.execute(
            f"SELECT AVG(latency_ms) as l FROM llm_logs {where}", params
        ).fetchone()["l"]
        or 0
    )
    errors = (
        conn.execute(
            "SELECT COUNT(*) as e FROM llm_logs WHERE guest_id = ? AND error IS NOT NULL",
            (guest_id,),
        ).fetchone()["e"]
        if guest_id
        else conn.execute(
            "SELECT COUNT(*) as e FROM llm_logs WHERE error IS NOT NULL"
        ).fetchone()["e"]
    )

    daily = conn.execute(
        f"""
        SELECT DATE(timestamp) as day,
               SUM(cost_usd) as cost,
               AVG(latency_ms) as avg_latency,
               COUNT(*) as calls
        FROM llm_logs {where}
        GROUP BY day ORDER BY day DESC LIMIT 30
        """,
        params,
    ).fetchall()

    recent = conn.execute(
        f"""
        SELECT timestamp, model, prompt, response,
               latency_ms, cost_usd, error
        FROM llm_logs {where}
        ORDER BY id DESC LIMIT 20
        """,
        params,
    ).fetchall()

    return {
        "total_calls": total,
        "total_cost_usd": round(cost, 4),
        "avg_latency_ms": round(avg_lat),
        "error_count": errors,
        "daily": [dict(r) for r in daily],
        "recent_traces": [dict(r) for r in recent],
    }


@app.post("/log")
def log_entry(entry: LogEntry):
    save_log(
        model=entry.model,
        prompt=entry.prompt,
        response=entry.response,
        input_tokens=entry.input_tokens,
        output_tokens=entry.output_tokens,
        latency_ms=entry.latency_ms,
        cost_usd=entry.cost_usd,
        error=entry.error,
        function=entry.function,
    )
    return {"status": "ok"}


@app.get("/guest/status")
def guest_status(guest_id: str = Query(..., min_length=8)):
    used = get_guest_calls_used(guest_id)
    return {
        "guest_id": guest_id,
        "calls_used": used,
        "calls_remaining": max(0, GUEST_LIMIT - used),
        "limit": GUEST_LIMIT,
    }


@app.post("/chat/guest")
def guest_chat(req: GuestChatRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")
    if len(req.guest_id.strip()) < 8:
        raise HTTPException(status_code=400, detail="Invalid guest session")

    guest_id = req.guest_id.strip()
    used = get_guest_calls_used(guest_id)
    if used >= GUEST_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Guest limit reached ({GUEST_LIMIT} calls). Add your own API key to continue.",
        )

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Guest demo unavailable — server API key not configured.",
        )

    start = time.perf_counter()
    error = None
    response_text = ""
    resolved_model = GUEST_MODEL
    input_tokens = 0
    output_tokens = 0

    try:
        result = call_openai_compatible(
            PROVIDER_BASE_URLS["openrouter"],
            api_key,
            GUEST_MODEL,
            req.prompt,
            "openrouter",
        )
        response_text = result["response"]
        resolved_model = result["model"]
        input_tokens = result["input_tokens"]
        output_tokens = result["output_tokens"]
    except httpx.HTTPStatusError as e:
        detail = e.response.text
        try:
            detail = e.response.json().get("error", {}).get("message", detail)
        except Exception:
            pass
        error = f"{e.response.status_code}: {detail}"
    except Exception as e:
        error = str(e)

    latency_ms = round((time.perf_counter() - start) * 1000)
    cost_usd = calculate_cost(resolved_model, input_tokens, output_tokens)

    save_log(
        model=resolved_model,
        prompt=req.prompt,
        response=response_text,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
        error=error,
        function="guest_chat",
        guest_id=guest_id,
    )

    if error:
        raise HTTPException(status_code=502, detail=error)

    calls_used = increment_guest_calls(guest_id)

    return {
        "response": response_text,
        "model": resolved_model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "latency_ms": latency_ms,
        "cost_usd": round(cost_usd, 6),
        "calls_used": calls_used,
        "calls_remaining": max(0, GUEST_LIMIT - calls_used),
    }


@app.post("/chat")
def chat(req: ChatRequest):
    if not req.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required")
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required")

    start = time.perf_counter()
    error = None
    response_text = ""
    resolved_model = req.model
    input_tokens = 0
    output_tokens = 0

    try:
        if req.provider == "anthropic":
            result = call_anthropic(req.api_key, req.model, req.prompt)
        elif req.provider == "custom":
            if not req.custom_base_url:
                raise HTTPException(
                    status_code=400, detail="Custom base URL is required"
                )
            result = call_openai_compatible(
                req.custom_base_url, req.api_key, req.model, req.prompt, "custom"
            )
        else:
            base_url = PROVIDER_BASE_URLS.get(req.provider)
            if not base_url:
                raise HTTPException(status_code=400, detail="Unknown provider")
            result = call_openai_compatible(
                base_url, req.api_key, req.model, req.prompt, req.provider
            )

        response_text = result["response"]
        resolved_model = result["model"]
        input_tokens = result["input_tokens"]
        output_tokens = result["output_tokens"]
    except httpx.HTTPStatusError as e:
        detail = e.response.text
        try:
            detail = e.response.json().get("error", {}).get("message", detail)
        except Exception:
            pass
        error = f"{e.response.status_code}: {detail}"
    except Exception as e:
        error = str(e)

    latency_ms = round((time.perf_counter() - start) * 1000)
    cost_usd = calculate_cost(resolved_model, input_tokens, output_tokens)

    save_log(
        model=resolved_model,
        prompt=req.prompt,
        response=response_text,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
        error=error,
    )

    if error:
        raise HTTPException(status_code=502, detail=error)

    return {
        "response": response_text,
        "model": resolved_model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "latency_ms": latency_ms,
        "cost_usd": round(cost_usd, 6),
    }


@app.get("/stats")
def get_stats(guest_id: Optional[str] = Query(None)):
    conn = sqlite3.connect(DB)
    try:
        return build_stats(conn, guest_id if guest_id else None)
    finally:
        conn.close()
