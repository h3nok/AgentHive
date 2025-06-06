from services.agents.lease_abstraction.agent import LeaseAbstractionAgent


def test_abstract_returns_dict(tmp_path):  # noqa: D401 – simple test
    # Create dummy PDF
    pdf_path = tmp_path / "sample.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 dummy")  # minimal header – pdfplumber will still open

    agent = LeaseAbstractionAgent()
    result = agent.abstract(blob_url=str(pdf_path))
    assert isinstance(result, dict)
    assert "expiry_date" in result
