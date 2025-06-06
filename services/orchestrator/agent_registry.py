"""Dynamic discovery of PydanticAI agents in `services/agents/*/agent.py`."""

from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path
from types import ModuleType
from typing import Dict, Type

from pydantic_ai import PydanticAIBaseAgent

_REGISTRY: Dict[str, Type[PydanticAIBaseAgent]] = {}


def _discover() -> None:
    base = Path(__file__).parent.parent / "agents"
    for pkg in pkgutil.iter_modules([str(base)]):
        if not pkg.ispkg:
            continue
        mod_name = f"services.agents.{pkg.name}.agent"
        try:
            mod: ModuleType = importlib.import_module(mod_name)
        except ModuleNotFoundError:  # pragma: no cover – allow missing
            continue
        for attr in dir(mod):
            obj = getattr(mod, attr)
            if (
                isinstance(obj, type)
                and issubclass(obj, PydanticAIBaseAgent)
                and obj is not PydanticAIBaseAgent
            ):
                _REGISTRY[obj.name] = obj  # type: ignore[attr-defined]


# Discover at import time
_discover()


def get(name: str) -> Type[PydanticAIBaseAgent]:
    return _REGISTRY[name]


def list_agents() -> Dict[str, Type[PydanticAIBaseAgent]]:  # noqa: D401
    return dict(_REGISTRY)
