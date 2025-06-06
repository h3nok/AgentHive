import httpx, asyncio
from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Any

app = FastAPI()

ROUTER_URL = "http://localhost:8001"  # router service
AGENTS = {
    "lease": "http://localhost:8002",
    "chart": "http://localhost:8003",
    "general": "http://localhost:8004"  # optional fallback
}

class ChatRequest(BaseModel):
    session_id: str
    message: str

@app.post("/v1/chat")
async def chat(req: ChatRequest):
    async with httpx.AsyncClient() as client:
        # ask router first
        r = await client.post(f"{ROUTER_URL}/route", json=req.dict())
        route_data = r.json()
        agent = route_data["route"]
        agent_url = AGENTS.get(agent, AGENTS["general"]) + "/chat"
        # forward to agent
        ar = await client.post(agent_url, json=req.dict())
        return ar.json() 