from fastapi import FastAPI, Request
from backend.shared.prompt_loader import build_prompt
from backend.shared.openai_client import stream_chat
import re

app = FastAPI()

# Helper to extract the first markdown table and any notes after it
def extract_markdown_table(text: str) -> str:
    # Remove lines that are just box-drawing or separator characters
    cleaned_lines = [
        line for line in text.splitlines()
        if line.count('|') >= 2 and not all(c in '─│┌┐└┘┬┴┼' for c in line.strip())
    ]
    cleaned_text = '\n'.join(cleaned_lines)
    # Now extract the markdown table as before
    table_regex = re.compile(
        r'((?:[^\n|]*\|[^\n|]*)+\n(?:\s*[-:|]+\s*\n)((?:[^\n|]*\|[^\n|]*)+\n?)+)',
        re.MULTILINE
    )
    match = table_regex.search(cleaned_text)
    if match:
        table = match.group(0).strip()
        after = cleaned_text[match.end():].strip()
        if after:
            return f"{table}\n\n{after}"
        return table
    return cleaned_text  # fallback: return cleaned text if no table found

@app.post("/chat")
async def chat(req: Request):
    body = await req.json()
    user_msg = body.get("message", "")
    session_ctx = body.get("session_context", {})

    prompt = build_prompt(
        template_path="prompt-templates/base.yaml",
        agent_path="agents/lease/prompt.yaml",
        replacements={
            "USER_INPUT": user_msg,
            "DYNAMIC_SESSION_CONTEXT_JSON": str(session_ctx),
        },
    )
    # Get the LLM response (stream or not)
    response = await stream_chat(prompt)
    # If response is a dict with 'message', clean it
    if isinstance(response, dict) and 'message' in response:
        response['message'] = extract_markdown_table(response['message'])
        return response
    # If response is a string, clean it
    if isinstance(response, str):
        return extract_markdown_table(response)
    return response 