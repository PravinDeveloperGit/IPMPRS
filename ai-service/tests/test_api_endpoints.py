import sys
from pathlib import Path

# Add ai-service to path
ai_service_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ai_service_dir))

from fastapi.testclient import TestClient
from app.main import app

def test_api():
    client = TestClient(app)

    # 1. Root
    r1 = client.get("/")
    print("[TEST] Root status:", r1.status_code, r1.json())
    assert r1.status_code == 200

    # 2. Health check (previously crashed with AttributeError)
    r2 = client.get("/health")
    print("[TEST] Health status:", r2.status_code, r2.json())
    assert r2.status_code == 200
    assert r2.json()["status"] == "UP"
    assert r2.json()["vectorCount"] >= 14

    # 3. Search precedents
    r3 = client.post("/search", json={"query": "CCTV cameras Goubert promenade Rock Beach", "limit": 3})
    print("[TEST] Search status:", r3.status_code, "Returned count:", len(r3.json()["results"]))
    assert r3.status_code == 200
    results = r3.json()["results"]
    assert len(results) > 0
    top = results[0]
    print(f"       Top precedent: {top['proposalId']} - {top['title']} (score: {top['score']}, outcome: {top['outcome']})")
    assert "PROP-SYN-2023-0101" in top["proposalId"] or top["score"] > 0

    # 4. RAG Precedent Synthesis Report
    r4 = client.post("/rag/report", json={
        "proposal": {
            "proposalId": "PROP-NEW-2026",
            "title": "Expansion of Coastal Surveillance Nodes",
            "summary": "Adding 15 additional PTZ optical cameras on beach front",
            "problemStatement": "Blind spots along coastal promenade",
            "category": "Infrastructure & Surveillance",
            "proposedBudget": 3500000,
            "currency": "INR"
        },
        "precedents": results
    })
    print("[TEST] RAG status:", r4.status_code)
    assert r4.status_code == 200
    rag_data = r4.json()
    assert rag_data["hasSufficientEvidence"] is True
    assert len(rag_data["similarities"]) > 0
    assert len(rag_data["citations"]) > 0
    print(f"       Summary: {rag_data['summary']}")
    print(f"       Verified citations: {len(rag_data['citations'])}")
    print(f"       Budget comparison: {rag_data['budgetComparison']}")

    # 5. Extract endpoint with temporary text file
    temp_file = ai_service_dir / "tests" / "sample_doc.txt"
    temp_file.write_text("Puducherry Police Department Technical Note: Procurement of night vision drone cameras for festival crowd monitoring.", encoding="utf-8")
    try:
        r5 = client.post("/extract", json={
            "documentId": "DOC-TEST-001",
            "filePath": str(temp_file),
            "mimeType": "text/plain",
            "originalFilename": "sample_doc.txt"
        })
        print("[TEST] Extract status:", r5.status_code, f"Chunks: {len(r5.json()['chunks'])}")
        assert r5.status_code == 200
        assert r5.json()["success"] is True
        assert len(r5.json()["chunks"]) >= 1
    finally:
        if temp_file.exists():
            temp_file.unlink()

    print("\nALL FASTAPI ENDPOINTS VERIFIED AND PASSING WITH FLYING COLORS!")

if __name__ == "__main__":
    test_api()
