# IPMPRS Testing Strategy & Acceptance Verification

## 1. Test Levels

1. **Unit Tests (Backend & AI Service)**
   - Password hashing and JWT generation/validation.
   - Zod schema validation for proposals, decisions, and chunk objects.
   - Text extraction parsers (PDF, DOCX) and token chunkers.
   - Citation validation logic (verifying that citations cite real chunk IDs in the retrieved context).

2. **Integration Tests**
   - Authentication flow (successful login, invalid credentials, token expiration).
   - Proposal lifecycle state transitions (Draft -> Submitted -> Under Review -> Approved/Rejected -> Implementation -> Closed).
   - Invalid transition rejections (e.g., attempting to approve a Draft directly).
   - Document upload, SHA-256 duplicate detection, and storage isolation.
   - Precedent search queries with known synthetic cases.

3. **Retrieval Evaluation**
   - Benchmark labeled queries (e.g., CCTV procurement, drone surveillance, traffic monitoring systems).
   - Retrieval quality verification (Recall@5, Precision@5, Mean Reciprocal Rank).

4. **Security & Access Control Tests**
   - Non-approver attempting to trigger `/api/proposals/:id/decision` (Must return HTTP 403 Forbidden).
   - Officer from unauthorized department accessing restricted documents.
   - Path traversal attempts in document retrieval endpoints.
