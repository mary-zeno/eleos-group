
from langchain_community.llms import HuggingFaceHub
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import os
from dotenv import load_dotenv
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# Load token from environment
token = os.getenv("HUGGINGFACEHUB_API_TOKEN")

# Option 1: Using HuggingFace Hub (API-based, recommended for production)
def create_hub_llm():
    return HuggingFaceHub(
        repo_id = "google/flan-t5-base",
        huggingfacehub_api_token=token,
        model_kwargs={"temperature": 0.5, "max_length": 512}
    )

# Option 2: Using local model (resource-intensive, for local development)
def create_local_llm():
    model_id = "gpt-2"
    
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(model_id, token=token)
    model = AutoModelForCausalLM.from_pretrained(model_id, token=token)

    
    # Create a pipeline
    pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        torch_dtype=torch.float16,
        device_map="auto",
        max_length=512,
        temperature=0.5,
        do_sample=True
    )
    
    # Wrap pipeline for LangChain compatibility
    from langchain.llms import HuggingFacePipeline
    return HuggingFacePipeline(pipeline=pipe)

# Choose which approach to use
try:
    # Try Hub first (recommended)
    llm = create_hub_llm()
    print("Using HuggingFace Hub API")
except Exception as e:
    print(f"Hub API failed: {e}")
    try:
        # Fallback to local model
        llm = create_local_llm()
        print("Using local model")
    except Exception as e:
        print(f"Local model failed: {e}")
        raise

# Prompt Template


prompt = PromptTemplate( input_variables=["input"], template="{input}")


# Create the chain
travel_chain = LLMChain(llm=llm, prompt=prompt)

def estimate_travel(data):
    try:
        input_text = f"""
        You are a travel cost estimator. Based on the inputs below, give an estimated total travel cost in USD, and a breakdown.

        Location: {data['location']}
        Accommodation Type: {data['accommodation_type']}
        Number of Rooms: {data['number_of_rooms']}
        Number of People: {data['number_of_people']}
        Duration: {data['duration']} days
        Transportation: {data['transportation']}
        Season: {data['season']}

        Respond with:
        1. Total estimated cost in USD
        2. Breakdown by lodging, transport, and season
        3. One short explanation
        """
        return travel_chain.invoke({"input": input_text})
    except Exception as e:
        return f"Error generating estimate: {str(e)}"


# Example usage
if __name__ == "__main__":
    # Sample data for testing
    sample_data = {
        "location": "Paris, France",
        "accommodation_type": "Hotel",
        "number_of_rooms": "2",
        "number_of_people": "4",
        "duration": "7",
        "transportation": "Flight + Metro",
        "season": "Summer"
    }
    
    # Test the function
    result = estimate_travel(sample_data)
    print("Travel Cost Estimate:")
    print(result)