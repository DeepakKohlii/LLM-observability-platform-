#!/usr/bin/env python3
"""
Post test prompts to the backend so the dashboard charts populate.

Usage:
  python examples/test_prompt.py "What is the capital of France?"
  python examples/test_prompt.py --seed          # 7 days of sample data for graphs
  python examples/test_prompt.py --seed "hi" "bye"  # seed + custom prompts
"""

import argparse
import datetime
import random
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

BACKEND = "http://localhost:8000"

SAMPLE_RESPONSES = {
    "What is the capital of France?": "The capital of France is Paris.",
    "Explain quantum computing in one sentence.": (
        "Quantum computing uses qubits that can be in superposition to process "
        "many possibilities at once."
    ),
    "Write a haiku about coding.": "Keys tap in the night\nBugs flee the morning sunlight\nDeploy succeeds now",
    "Summarize REST in 10 words.": "HTTP methods on resources; stateless client-server API style.",
    "What is 17 * 23?": "391",
}


def post_log(
    prompt: str,
    *,
    response: str | None = None,
    model: str = "gpt-4o-mini",
    latency_ms: int | None = None,
    cost_usd: float | None = None,
    error: str | None = None,
    timestamp: datetime.datetime | None = None,
) -> None:
    ts = timestamp or datetime.datetime.now(datetime.UTC)
    latency = latency_ms if latency_ms is not None else random.randint(80, 2400)
    cost = cost_usd if cost_usd is not None else round(random.uniform(0.0001, 0.012), 6)
    output = response if response is not None else SAMPLE_RESPONSES.get(
        prompt, f"Mock response for: {prompt[:80]}"
    )

    payload = {
        "timestamp": ts.isoformat(),
        "function": "test_prompt",
        "model": model,
        "prompt": prompt,
        "response": output,
        "input_tokens": max(10, len(prompt) // 4),
        "output_tokens": max(5, len(output) // 4),
        "latency_ms": latency,
        "cost_usd": cost,
        "error": error,
    }

    r = httpx.post(f"{BACKEND}/log", json=payload, timeout=5)
    r.raise_for_status()
    print(f"✓ logged: {prompt[:60]}{'…' if len(prompt) > 60 else ''}")


def seed_chart_data() -> None:
    """Insert traces across the last 7 days so cost/calls charts have points."""
    models = ["gpt-4o-mini", "gpt-4o", "claude-sonnet-4-20250514"]
    prompts = list(SAMPLE_RESPONSES.keys())

    print("Seeding 7 days of chart data…")
    for day_offset in range(6, -1, -1):
        day = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=day_offset)
        calls = random.randint(3, 12)
        for _ in range(calls):
            prompt = random.choice(prompts)
            hour = random.randint(8, 20)
            ts = day.replace(hour=hour, minute=random.randint(0, 59), second=0, microsecond=0)
            post_log(
                prompt,
                model=random.choice(models),
                timestamp=ts,
                latency_ms=random.randint(200, 3500),
                cost_usd=round(random.uniform(0.0002, 0.02), 6),
            )
    print("Done. Refresh the dashboard to see graphs.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Send test prompts to llm_observe backend")
    parser.add_argument("prompts", nargs="*", help="Prompt(s) to log")
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Seed 7 days of random traces (fills cost/calls charts)",
    )
    parser.add_argument("--error", action="store_true", help="Log last prompt as failed")
    args = parser.parse_args()

    try:
        httpx.get(f"{BACKEND}/stats", timeout=3).raise_for_status()
    except httpx.HTTPError as e:
        print(f"Backend not reachable at {BACKEND}. Start it with:")
        print("  cd backend && uvicorn main:app --reload --port 8000")
        sys.exit(1)

    if args.seed:
        seed_chart_data()

    prompts = args.prompts or (
        [] if args.seed else ["What is the capital of France?"]
    )

    for i, prompt in enumerate(prompts):
        err = "rate limit exceeded" if args.error and i == len(prompts) - 1 else None
        post_log(prompt, error=err)

    if prompts:
        print(f"\nView stats: {BACKEND}/stats")
        print("Refresh the dashboard (↻ refresh) to update charts.")


if __name__ == "__main__":
    main()
