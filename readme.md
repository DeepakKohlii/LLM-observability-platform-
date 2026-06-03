# llm_observe

Observability for LLM apps — trace every call, see cost and latency on a live dashboard.

## Quick start (web)

**Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd llm-observe-ui
npm install
npm run dev
```

Open the app → **Try it free** (5 guest calls) or **Use your API key** in Chat Playground.

---

## Python SDK — what is `@observe`?

`@observe` is a **decorator** in `sdk/observe.py`. Put it on any Python function that calls an LLM (OpenAI, OpenRouter, etc.). Each time that function runs, the decorator:

1. **Measures latency** (milliseconds)
2. **Reads the LLM response** — model name, prompt/response text, input/output tokens
3. **Estimates cost** (USD) from token counts
4. **Sends a trace** to your backend at `POST http://localhost:8000/log`

Traces show up on the **Dashboard** (metrics, charts, recent traces table). You do not write logging code yourself.

### How to use it

**1. Start the backend** (required — the SDK posts traces here):

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**2. Install dependencies** for your script:

```bash
pip install openai httpx
```

**3. Add the decorator** to your LLM function:

```python
import sys
from pathlib import Path

# Add project root so `from sdk.observe import observe` works
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from openai import OpenAI
from sdk.observe import observe

client = OpenAI(api_key="YOUR_KEY", base_url="https://openrouter.ai/api/v1")

@observe
def ask(prompt: str):
    return client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )

response = ask("What is the capital of France?")
print(response.choices[0].message.content)
```

**4. Open the dashboard** (`npm run dev` in `llm-observe-ui`) — your call appears in graphs and the traces table.

### Full example

See [`examples/demo.py`](examples/demo.py). Run:

```bash
export OPENROUTER_API_KEY="your-key"
python examples/demo.py
```

### Test without a real LLM

Seed fake traces for dashboard testing:

```bash
python examples/test_prompt.py --seed
```

### Requirements

| Piece | Purpose |
|--------|---------|
| Backend on `:8000` | Receives and stores traces (`logs.db`) |
| `@observe` on your function | Auto-logging wrapper |
| OpenAI-compatible response | SDK reads `.usage`, `.model`, `.choices` (works with official OpenAI client) |

### Changing the backend URL

Default is `http://localhost:8000` in `sdk/observe.py`:

```python
BACKEND_URL = "http://localhost:8000"
```

Change this if your API runs elsewhere.

---

## Project layout

```
backend/          FastAPI server, SQLite, /stats, /chat, /log
sdk/              @observe decorator
examples/         demo.py, test_prompt.py
llm-observe-ui/   React dashboard + chat
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Dashboard metrics (optional `?guest_id=` for guest sessions) |
| POST | `/log` | Ingest a trace (used by SDK) |
| POST | `/chat` | Chat with your own API key |
| POST | `/chat/guest` | Guest demo (5 calls per session) |
