import sys
from pathlib import Path

# Add app parent to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.chunking.chunker import TextChunker
from app.embeddings.embedder import LocalEmbedder
from app.retrieval.vector_store import FAISSVectorStore
from app.rag.citation_validator import CitationValidator
from app.rag.synthesizer import RAGSynthesizer

def test_chunker():
    pages = [
        {"page_number": 1, "text": "Section 1: General installation of CCTV cameras in promenade area.\nSection 2: High bandwidth fiber optic cabling to Police Control Room.", "section_title": "Page 1"}
    ]
    chunks = TextChunker.chunk_pages(pages, chunk_size=80, overlap=20)
    assert len(chunks) >= 1
    assert "CCTV" in chunks[0]["text"]
    print("[PASS] test_chunker passed")

def test_embedder_and_faiss():
    texts = [
        "Procurement of 42 high definition CCTV cameras along promenade",
        "Solar powered standalone wireless surveillance cameras for rural checkpost",
        "Automated Number Plate Recognition ANPR on Anna Salai arterial junction",
    ]
    embeddings = LocalEmbedder.embed_texts(texts)
    assert embeddings.shape == (3, 384)

    store = FAISSVectorStore(persist=False)
    metadata = [{"title": f"Doc {i}", "text": t} for i, t in enumerate(texts)]
    ref_ids = store.add_vectors(embeddings, metadata)
    assert len(ref_ids) == 3

    query_vec = LocalEmbedder.embed_query("CCTV camera promenade surveillance")
    results = store.search(query_vec, top_k=2)
    assert len(results) >= 1
    assert results[0][1] >= 0.0
    print("[PASS] test_embedder_and_faiss passed")

def test_citation_validator():
    precedents = [
        {"proposalId": "PROP-001", "sourceDocument": "Synthetic Sanction Order 419", "pageReference": 3}
    ]
    citations = [
        {"documentTitle": "Synthetic Sanction Order 419", "pageNumber": 3, "claim": "Approved 44 lakhs"},
        {"documentTitle": "NonExistent File 999", "pageNumber": 1, "claim": "Fabricated fact"}
    ]
    validated = CitationValidator.validate_citations(citations, precedents)
    assert validated[0]["isVerified"] is True
    assert validated[1]["isVerified"] is False
    print("[PASS] test_citation_validator passed")

def test_rag_synthesizer():
    proposal = {
        "proposalId": "PROP-TEST-01",
        "title": "Smart City CCTV Expansion",
        "category": "Infrastructure & Surveillance",
        "proposedBudget": 4000000,
        "summary": "Expansion of surveillance nodes",
        "problemStatement": "Blind spots in heritage quarters"
    }
    precedents = [
        {
            "proposalId": "PROP-SYN-2023-0101",
            "title": "CCTV Coastal Promenade",
            "score": 0.88,
            "outcome": "Approved",
            "decidedAmount": 4400000,
            "decisionReason": "Sanctioned with fiber backbone",
            "implementationStatus": "Implemented",
            "implementationOutcome": "38 cameras deployed",
            "actualCost": 4350000,
            "sourceDocument": "Synthetic Sanction Order No. POL/TECH/2023/419",
            "pageReference": 3,
        }
    ]
    report = RAGSynthesizer.synthesize_report(proposal, precedents)
    assert report["hasSufficientEvidence"] is True
    assert len(report["citations"]) >= 1
    assert report["citations"][0]["isVerified"] is True
    assert "uncertaintyNotice" in report
    print("[PASS] test_rag_synthesizer passed")

if __name__ == "__main__":
    test_chunker()
    test_embedder_and_faiss()
    test_citation_validator()
    test_rag_synthesizer()
    print("ALL AI SERVICE TESTS PASSED SUCCESSFULLY!")
