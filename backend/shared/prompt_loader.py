from pathlib import Path
import yaml
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent


def load_yaml(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def build_prompt(template_path: str, agent_path: str, replacements: Dict[str, str]) -> List[Dict[str, str]]:
    """Return list[{'role': 'system'|'user'|'assistant', 'content': str}]"""
    template = load_yaml(BASE_DIR / template_path)
    agent_cfg = load_yaml(BASE_DIR / agent_path)

    merged = {**template}
    merged_vars = {**agent_cfg, **replacements}

    def substitute(value: str) -> str:
        for k, v in merged_vars.items():
            value = value.replace(f"<{k}>", v)
        return value

    messages = []
    for role, content in merged.items():
        if not isinstance(content, str):
            continue
        messages.append({
            "role": "system" if role in ("system", "role") else role,
            "content": substitute(content),
        })
    return messages 