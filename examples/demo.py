import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from openai import OpenAI
from sdk.observe import observe

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

@observe
def ask(prompt):
    return client.chat.completions.create(
        model="openai/gpt-4o-mini",   # or meta-llama/llama-3.1-8b-instruct:free
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

# Automatically tracked
response = ask("What is the capital of France?")
print(response.choices[0].message.content)