"""Local stub for external `pydantic_ai` package.

Provides minimal `PydanticAIBaseAgent` and `ai_tool` decorator so that the
agent code can run inside containers without installing the real package.
Remove this file once the true library is added to `requirements.txt`.
"""
from __future__ import annotations

from typing import Any, Callable

__all__ = ["ai_tool", "PydanticAIBaseAgent"]


def ai_tool(*_args, **_kwargs):  # noqa: D401
    """Decorator stub – returns function unchanged."""

    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        return func

    if _args and callable(_args[0]):
        return _args[0]  # type: ignore[return-value]
    return decorator


class PydanticAIBaseAgent:  # noqa: D101 – stub only
    name: str = "stub-agent"
    description: str = ""

    async def run(self, text: str, model: str | None = None, **kwargs: Any) -> Any:  # noqa: D401
        if hasattr(self, "abstract") and callable(getattr(self, "abstract")):
            return getattr(self, "abstract")(blob_url=text)  # type: ignore[arg-type]
        return text
