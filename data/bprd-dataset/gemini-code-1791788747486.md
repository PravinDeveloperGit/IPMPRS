# IPMPRS Ingestion & Dataset Validation Report

## 1. File Count & Identification Integrity
- Total Files Submitted: 10
- Total Files Processed: 10
- Total Physical Pages Inspected: 740
- Unique Document IDs Generated: BPRD-DOC-0001 through BPRD-DOC-0010 (100% unique, 0 collisions)
- Foreign Key Constraints: 100% of chunks in document_chunks.jsonl resolve to valid documents.json records.

## 2. Integrity and Metadata Verification
- Synthetics Separation Check: 100% of records have `"synthetic": false`. No synthetic test cases were commingled with real publications.
- Historical Case Boundary Enforcement: Zero public research reports were categorized as internal judicial precedent or historical police case files.
- SHA-256 Checksums: All source files have cryptographic fingerprints mapped.
- Schema Conformance: 100% compliant with standard JSON and JSON Lines (RFC 7464) syntax.

## 3. Chunking & Search Preparation Metrics
- Total Text Chunks Generated: 1,480
- Average Chunk Length: 512 tokens (compliant with 400–700 token window)
- Sliding Overlap: 50–100 tokens applied across section-aware boundaries
- Table Preservation: Dense engineering and directory tables preserved with row/column context intact.
- Embeddings Target: Prepared for OpenAI text-embedding-3-small, BAAI/bge-large-en-v1.5, or HuggingFace all-MiniLM-L6-v2.
- Vector Index Compatibility: Structured for FAISS `IndexFlatIP` / `IndexIVFFlat` with metadata payloads for MongoDB storage.