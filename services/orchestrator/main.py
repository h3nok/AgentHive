"""FastAPI Orchestrator routes chat to registered PydanticAI agents."""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from agent_registry import get as get_agent

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pydantic I/O models
# ---------------------------------------------------------------------------


class ChatInput(BaseModel):
    text: str
    model_id: Optional[str] = Field(None, alias="modelId")


class ChatOutput(BaseModel):
    text: str
    tokens: Dict[str, int] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="TSC Orchestrator", version="0.1.0")

MODEL_DEFAULT = os.getenv("MODEL_DEFAULT", "gpt-4o")

# TODO: hook Redis for session context cache ----------------------


@app.post("/chat/{agent_id}", response_model=ChatOutput)
async def chat(agent_id: str, body: ChatInput) -> ChatOutput:  # noqa: D401
    try:
        AgentCls = get_agent(agent_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown agent") from exc

    agent = AgentCls()
    model = body.model_id or MODEL_DEFAULT

    # TODO: pass user / jwt claims -----------------------------------------------------

    try:
        resp = await agent.run(body.text, model=model)  # type: ignore[arg-type]
    except Exception as exc:  # pragma: no cover – generic catch until finer errors
        logger.exception("Agent run failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Agent error") from exc

    return ChatOutput(text=str(resp), tokens={})
