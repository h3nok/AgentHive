"""Lease Abstraction Agent implemented with PydanticAI."""
from __future__ import annotations

from pydantic_ai import PydanticAIBaseAgent, ai_tool

from .tools import parse_lease_pdf, extract_dates


class LeaseAbstractionAgent(PydanticAIBaseAgent):
    name = "lease-abstraction"
    description = "Summarise key lease clauses and expirations."

    @ai_tool(description="Return expiry & key clauses from lease PDF")
    def abstract(self, *, blob_url: str) -> dict:  # type: ignore[override]
        pdf_text = parse_lease_pdf(blob_url)
        return extract_dates(pdf_text)
