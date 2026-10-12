# IPMPRS Security & Compliance Architecture

## 1. Threat Model & Security Posture

IPMPRS processes sensitive departmental procurement, infrastructure blueprints, operational logistics, and historical intelligence. The system adopts a Zero-Trust architecture adhering to modern police informatics standards.

### Threat Mitigations

| Threat | Risk Level | Mitigation Strategy |
| :--- | :---: | :--- |
| **Unauthorized Privilege Escalation** | Critical | Server-side middleware verifies both JWT identity claims and fresh database permissions per endpoint; frontend controls are purely ergonomic. |
| **Document Exfiltration** | High | Original files are stored in protected local filesystem volumes outside web server docroot; downloads stream via authenticated token exchange with audit logging. |
| **Malicious File Upload / Code Exec** | High | Rigid validation of MIME types, magic bytes (`%PDF`, `PK\x03\x04`), strict file size limits (25MB), checksum hashing (SHA-256), and path traversal sanitization. |
| **Prompt Injection / Jailbreaking** | High | Uploaded document contents are strictly treated as untrusted data. Prompts enclose extracted chunks in isolated XML tags (`<source_document>`), and LLM output schemas are constrained via JSON parsing and strict citation verification against active chunk IDs. |
| **Hallucination / Unsupported Sanction Advice** | Critical | Prompt system forbids AI from recommending approvals or guessing budgets. Citations must match chunk IDs retrieved by FAISS. Unsubstantiated claims are rejected with "Insufficient evidence found". |
| **Tampering with Official Records** | Critical | Audit trails are append-only. Proposals, decisions, and workflow logs cannot be destructively altered or erased through the normal REST API. |

---

## 2. Authentication & Session Hygiene

- Passwords hashed using `bcrypt` with salt round factor >= 10.
- JWT tokens signed with strong secrets (`HS256` or `RS256`), configurable expiration (e.g. 8 hours), and renewal.
- CORS restricted to explicit origin whitelists (`http://localhost:5173` in development).
- Rate limiting implemented on authentication routes and expensive AI RAG generation endpoints.
- Error handlers sanitize stack traces in production to prevent environmental reconnaissance.
