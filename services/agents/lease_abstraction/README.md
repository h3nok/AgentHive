# Lease Abstraction Agent

Rewritten with `pydantic_ai` 0.9+.  Provides `abstract(blob_url)` which extracts
expiry date and key clauses from a lease PDF.

## TODO
* Replace regex-based date extraction with NLP.
* Swap pdfplumber for Azure Cognitive Search OCR pipeline.
