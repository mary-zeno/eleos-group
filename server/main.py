from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
import re

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
    You are a travel cost estimator for Ethiopia. Provide an estimated range of total travel cost in USD based on the following inputs:

    - City/Region: {data.location}
    - Type of accommodation: {data.accommodation}
    - Number of travelers: {data.people}
    - Travel month: {data.season}

   Return the result in the following format:

    Low Estimate Range: $XXXX - $YYYY
    High Estimate Range: $AAAA - $BBBB  
    Cost Breakdown: Cost breakdown for both ranges.
    """

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return {"error": "Missing OpenRouter API key."}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:3000",  # or your actual frontend URL
        "Content-Type": "application/json"
    }

    # 🔁 Reliable, fast, low-cost model
    payload = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)

    try:
        result = response.json()
    except Exception as e:
        return {"error": "Invalid JSON returned", "detail": str(e)}

    if "choices" not in result:
        return {"error": "No 'choices' key in OpenRouter response", "full_response": result}

    content = result["choices"][0]["message"]["content"]

    # Regex to extract ranges
    low_match = re.search(r"Low Estimate Range:?\s*\$?(\d+(?:,\d+)?)\s*-\s*\$?(\d+(?:,\d+)?)", content, re.IGNORECASE)
    high_match = re.search(r"High Estimate Range:?\s*\$?(\d+(?:,\d+)?)\s*-\s*\$?(\d+(?:,\d+)?)", content, re.IGNORECASE)

    if low_match and high_match:
        return {
            "low_estimate_start": int(low_match.group(1).replace(",", "")),
            "low_estimate_end": int(low_match.group(2).replace(",", "")),
            "high_estimate_start": int(high_match.group(1).replace(",", "")),
            "high_estimate_end": int(high_match.group(2).replace(",", "")),
            "notes": content
        }
    else:
        return {
            "error": "Could not parse estimate ranges from model output",
            "raw": content
        }
