from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

class LLMRequest(BaseModel):
    prompt: str


@router.post("/api/generate")
async def generate_text(data: LLMRequest):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": data.prompt}
        ]
    )

    return {"response": response.choices[0].message.content}