import time
import functools
import httpx
import datetime

BACKEND_URL = "http://localhost:8000"

COST_PER_1K_TOKENS = {
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "claude-sonnet-4-20250514": {"input": 0.003, "output": 0.015},
}

def calculate_cost(model, input_tokens, output_tokens):
    pricing = COST_PER_1K_TOKENS.get(model, {"input": 0.001, "output": 0.002})
    return (input_tokens / 1000 * pricing["input"]) + \
           (output_tokens / 1000 * pricing["output"])

def observe(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        error = None
        response = None

        try:
            response = func(*args, **kwargs)
        except Exception as e:
            error = str(e)
            raise
        finally:
            latency_ms = round((time.perf_counter() - start) * 1000)

            input_tokens = 0
            output_tokens = 0
            model = "unknown"
            output_text = ""

            if response:
                usage = getattr(response, "usage", None)
                if usage:
                    input_tokens = usage.prompt_tokens
                    output_tokens = usage.completion_tokens
                model = getattr(response, "model", "unknown")
                choices = getattr(response, "choices", [])
                if choices:
                    output_text = choices[0].message.content or ""

            prompt = kwargs.get("prompt", "") or \
                     (str(args[0]) if args else "")

            log = {
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "function": func.__name__,
                "model": model,
                "prompt": prompt,
                "response": output_text,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms,
                "cost_usd": calculate_cost(model, input_tokens, output_tokens),
                "error": error,
            }

            try:
                httpx.post(f"{BACKEND_URL}/log", json=log, timeout=2)
            except Exception:
                pass  

        return response
    return wrapper
    