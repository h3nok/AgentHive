"""
Support agent implementation for handling customer support inquiries, FAQ answer retrieval, and ticket triage.

This minimal implementation delegates LLM work to the shared adapter factory.  It is intentionally lightweight so the
backend stops throwing `AgentNotFoundException` when the frontend requests the `support` agent type.
"""

from typing import Union, AsyncIterator

from app.domain.agent_factory import BaseAgent
from app.domain.schemas import RequestContext, AgentResponse, AgentType, AgentManifest
from app.adapters.llm_openai import OpenAIAdapter
from app.adapters.llm_ollama import OllamaAdapter
from app.core.observability import get_logger, measure_tokens

logger = get_logger(__name__)


class Agent(BaseAgent):
    """Customer-support specialist agent implementation."""

    def __init__(self, agent_id: str, manifest: AgentManifest):
        super().__init__(agent_id, manifest)
        self.llm_adapter: Union[OpenAIAdapter, OllamaAdapter, None] = None
        self.system_prompt = manifest.config.get(
            "system_prompt",
            "You are a helpful customer-support assistant. Always resolve the customer's issue or guide them to the next step."  # noqa: E501
        )

    async def _initialize(self) -> None:
        """Initialise the agent by selecting an LLM adapter."""
        from app.domain.llm_factory import create_llm_adapter
        try:
            self.llm_adapter = create_llm_adapter()
            logger.info("Support agent initialised: %s", self.agent_id)
        except Exception as exc:  # pragma: no cover – defensive
            logger.error("Failed to initialise Support agent LLM adapter: %s", exc)
            raise RuntimeError("Support agent initialisation failed – no LLM provider available") from exc

    # ---------------------------------------------------------------------
    # Public API required by `BaseAgent`
    # ---------------------------------------------------------------------
    async def handle(self, context: RequestContext) -> Union[AgentResponse, AsyncIterator[str]]:  # noqa: D401
        """Handle a customer-support prompt synchronously (no streaming for now)."""
        try:
            if not self.llm_adapter:
                await self._initialize()

            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": context.prompt.prompt},
            ]

            if context.prompt.history:
                # Include limited history for better context
                for msg in context.prompt.history[-5:]:
                    messages.insert(-1, {"role": msg.role.value, "content": msg.content})

            @measure_tokens
            async def get_response():
                if not self.llm_adapter:  # paranoid check
                    raise RuntimeError("LLM adapter not initialised")
                return await self.llm_adapter.complete(
                    prompt=context.prompt.prompt,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=800,
                )

            response = await get_response()
            return AgentResponse(
                content=response.content,
                agent_id=self.agent_id,
                agent_type=AgentType.SUPPORT,
            )
        except Exception as exc:  # broad to avoid crashing SSE stream
            logger.error("Support agent error: %s", exc)
            return AgentResponse(
                content=(
                    "I'm sorry – I ran into an error while processing your request. "
                    "Please try again or contact support."
                ),
                agent_id=self.agent_id,
                agent_type=AgentType.SUPPORT,
                metadata={"error": str(exc)},
            )

    # ------------------------------------------------------------------
    # Optional helpers
    # ------------------------------------------------------------------
    def get_capabilities(self) -> list[str]:  # noqa: D401
        return self.manifest.capabilities
