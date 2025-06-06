import os
from typing import List, Dict, Generator
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio

# Placeholder – replace with real OpenAI client
async def async_stream_chat(messages: List[Dict[str, str]]):
    # Fake token-by-token stream
    content = "This is a mock response because OPENAI_API_KEY is not set."
    for tok in content.split():
        yield tok + " "
        await asyncio.sleep(0.05)


def stream_chat(messages: List[Dict[str, str]]):
    async def streamer():
        async for chunk in async_stream_chat(messages):
            yield chunk
    return StreamingResponse(streamer(), media_type="text/plain") 