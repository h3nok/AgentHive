from fastapi import FastAPI, Request
from shared.prompt_loader import build_prompt
from shared.openai_client import stream_chat

app = FastAPI()

@app.post("/chat")
async def chat(req: Request):
    body = await req.json()
    user_msg = body.get("message", "")

    prompt = build_prompt(
        template_path="prompt-templates/base.yaml",
        agent_path="agents/chart/prompt.yaml",
        replacements={
            "USER_INPUT": user_msg,
            "DYNAMIC_SESSION_CONTEXT_JSON": "{}",
        },
    )
    return stream_chat(prompt) 