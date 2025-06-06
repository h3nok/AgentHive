"""Lease Abstraction parsing helpers migrated from legacy code.

Currently uses pdfplumber for simple text extraction.  Replace with Azure
Blob download + production-grade parsing later.
"""

from __future__ import annotations

import logging
from typing import Dict

import pdfplumber

logger = logging.getLogger(__name__)


# --- @ai_tool functions -----------------------------------------------------


def parse_lease_pdf(blob_url: str) -> str:  # noqa: D401
    """Download (local path or URL) and return plain text."""

    # TODO: if blob_url is http(s) – download first

    try:
        with pdfplumber.open(blob_url) as pdf:
            pages_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as exc:  # pragma: no cover – lenient until prod
        logger.exception("Failed to parse PDF: %s", exc)
        raise

    return pages_text


def extract_dates(text: str) -> Dict[str, str]:  # noqa: D401
    """Return dict of key dates (very naive placeholder)."""
    import re

    # Simple regex – extract first date-like string
    match = re.search(r"(\d{1,2}/\d{1,2}/\d{2,4})", text)
    expiry = match.group(1) if match else "UNKNOWN"

    return {"expiry_date": expiry, "clauses": []}
