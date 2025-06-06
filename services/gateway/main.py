"""FastAPI Gateway service

Acts as a thin proxy around OpenAI / Azure OpenAI chat completions, with
basic validation + logging.  Leave placeholders for PII scrubber &
Observability instrumentation.
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field, validator

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------------


class Message(BaseModel):
    role: str
    content: str

    @validator("role")
    def _role_must_be_valid(cls, v: str) -> str:  # noqa: D401 – pylint style
        if v not in {"user", "assistant", "system"}:
            raise ValueError("role must be one of user|assistant|system")
        return v


class CompletionRequest(BaseModel):
    model: Optional[str] = Field(None, alias="modelId")
    messages: List[Message]
    temperature: float = 0.7


class CompletionResponse(BaseModel):
    id: str
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, Any]


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="TSC Gateway", version="0.1.0")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL_DEFAULT = os.getenv("MODEL_DEFAULT", "gpt-4o")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set – /v1/completions will error")


@app.post("/v1/completions", response_model=CompletionResponse)
async def completions(req: CompletionRequest) -> CompletionResponse:  # noqa: D401
    """Proxy to OpenAI chat completions with minimal validation."""

    # TODO: run PII scrubber here  ------------------------------

    payload = {
        "model": req.model or MODEL_DEFAULT,
        "messages": [m.dict() for m in req.messages],
        "temperature": req.temperature,
    }

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    url = f"{OPENAI_BASE_URL}/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
    except httpx.HTTPError as exc:  # pragma: no cover
        logger.error("OpenAI request failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Upstream error") from exc

    data = r.json()
    # Log tokens usage if present
    if "usage" in data:
        logger.info("prompt_tokens=%s completion_tokens=%s", data["usage"].get("prompt_tokens"), data["usage"].get("completion_tokens"))

    return CompletionResponse(**data)
