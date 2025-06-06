from fastapi import FastAPI, Request
from pydantic import BaseModel
import time, uuid, json, asyncio
from typing import List
from fastapi.responses import JSONResponse
from shared.prompt_loader import build_prompt
from shared.openai_client import stream_chat

# Simple in-process pubsub list of queues per websocket
subscribers: List[asyncio.Queue] = []

app = FastAPI()

class RouteRequest(BaseModel):
    session_id: str
    message: str

AGENT_KEYWORDS = {
    "chart": ["/chart", "graph", "chart"],
    "lease": ["lease", "rent", "property"],
}


def classify(text: str) -> str:
    t = text.lower()
    for agent, kws in AGENT_KEYWORDS.items():
        if any(k in t for k in kws):
            return agent
    return "general"


@app.post("/route")
async def route(req: RouteRequest):
    start = time.time()
    agent = classify(req.message)
    latency = int((time.time() - start) * 1000)
    trace_id = str(uuid.uuid4())
    step_id = str(uuid.uuid4())
    trace = {
        "id": trace_id,
        "sessionId": req.session_id,
        "query": req.message,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalLatency": latency,
        "finalAgent": agent,
        "finalConfidence": 1,
        "steps": [
            {
                "id": step_id,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "step": "keyword-match",
                "agent": agent,
                "confidence": 1,
                "intent": "demo",
                "method": "regex",
                "latency_ms": latency,
            }
        ],
        "success": True,
    }
    # push to subscribers
    for q in subscribers:
        await q.put(json.dumps(trace))
    return {"route": agent, "trace": trace}

@app.websocket("/v1/debug/router-trace/{session_id}")
async def trace_ws(websocket, session_id: str):
    await websocket.accept()
    q: asyncio.Queue = asyncio.Queue()
    subscribers.append(q)
    try:
        while True:
            msg = await q.get()
            await websocket.send_text(msg)
    except Exception:
        pass
    finally:
        subscribers.remove(q)
        await websocket.close() 