from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EstimateRequest(BaseModel):
    location: str
    accommodation: str
    people: int
    season: str

@app.post("/api/estimate")
def get_estimate(data: EstimateRequest):
    prompt = f"""
You are a travel cost estimator. Estimate the total travel cost in USD for:
- Location: {data.location}
- Accommodation type: {data.accommodation}
- Number of people: {data.people}
- Time of year: {data.season}
Provide a low and high range in USD.
"""

    api_key = os.getenv("OPENROUTER_API_KEY")
    print("Loaded API Key:", api_key)

    # 🧪 DEBUG: Print available models
    model_list_response = requests.get(
        "https://openrouter.ai/api/v1/models",
        headers={"Authorization": f"Bearer {api_key}"}
    )
    # 🧪 DEBUG: Print only the first 5 available models
    try:
        models = model_list_response.json()
        free_models = []

        for model in models.get("data", []):
            pricing = model.get("pricing", {})

            try:
                input_cost = float(pricing.get("prompt", "1"))
                output_cost = float(pricing.get("completion", "1"))
            except ValueError:
                continue  # skip if pricing is malformed

            if input_cost == 0.0 and output_cost == 0.0:
                free_models.append(model)

        print("🆓 Free Models Available:")
        for m in free_models[:5]:  # Limit to first 5 for readability
            print(f"- {m.get('id')} ({m.get('name')})")

        if not free_models:
            print("⚠️  No free models available. You may need to add credits.")

    except Exception as e:
        print("❌ Failed to load or parse model list:", str(e))



    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:3000",  # or your frontend URL
        "Content-Type": "application/json"
    }

    payload = {
        "model": "baidu/ernie-4.5-300b-a47b",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)

    try:
        result = response.json()
    except Exception as e:
        return {"error": "Invalid JSON returned", "detail": str(e)}

    if "choices" not in result:
        return {"error": "No 'choices' key in OpenRouter response", "full_response": result}

    return {"estimate": result["choices"][0]["message"]["content"]}

