# IPMPRS REST API Specification

All backend endpoints are prefixed with `/api`. Protected routes require a Bearer token in the `Authorization` header (`Authorization: Bearer <jwt_token>`).

## 1. Authentication & Identity
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ token, user: { id, email, displayName, role, departmentId } }`
- `POST /api/auth/logout`
  - Logs out current session, records audit event.
- `GET /api/auth/me`
  - Returns sanitized current user profile.

## 2. Proposals
- `GET /api/proposals`
  - Query params: `page`, `limit`, `search`, `category`, `status`, `departmentId`, `sortBy`, `sortOrder`
- `POST /api/proposals`
  - Body: `{ title, summary, problemStatement, category, departmentId, proposedBudget, currency, implementationTimeline }`
- `GET /api/proposals/:id`
  - Returns complete proposal entity, workflow events, observations, decisions, implementation details, linked documents.
- `PATCH /api/proposals/:id`
  - Updates draft proposal fields. Restricted to Creator before submission.
- `POST /api/proposals/:id/submit`
  - Transitions `Draft` -> `Submitted`. Validates all mandatory fields.
- `POST /api/proposals/:id/observations`
  - Records reviewer observations. Transitions `Submitted` -> `Under Review`.
- `POST /api/proposals/:id/clarification`
  - Requests clarification from creator. Transitions `Under Review` -> `Clarification Requested`.
- `POST /api/proposals/:id/resubmit`
  - Creator submits clarification response. Transitions `Clarification Requested` -> `Resubmitted` -> `Under Review`.
- `POST /api/proposals/:id/decision`
  - Approving authority records decision (`Approved` | `Rejected`) with sanction amount and formal rationale.
- `POST /api/proposals/:id/implementation`
  - Updates milestone progress, actual expenditures, and deliverables. Transitions `Approved` -> `Implementation In Progress` -> `Implemented`.
- `POST /api/proposals/:id/close`
  - Transitions `Implemented` or `Rejected` -> `Closed`. Triggers indexing into searchable precedent corpus.

## 3. Documents & Knowledge Repository
- `POST /api/documents`
  - Multi-part form upload with file validation (MIME, magic numbers, checksum), linked proposal ID, access level.
- `GET /api/documents`
  - List authorized documents with extraction status, checksum, page count.
- `GET /api/documents/:id`
  - Fetch metadata and processing status.
- `GET /api/documents/:id/content`
  - Retrieve extracted text chunks and section trees.
- `GET /api/documents/:id/download`
  - Secure streamed download with RBAC enforcement and audit record.
- `POST /api/documents/:id/reprocess`
  - Re-extract and re-index vector representations.

## 4. Precedents & AI Analysis
- `POST /api/precedents/search`
  - Body: `{ query, category, departmentId, outcome, dateFrom, dateTo, limit }`
  - Returns ranked list of semantically and lexically matched historical proposals and document chunks with score, citation, and outcome summary.
- `POST /api/ai/proposals/:id/report`
  - Synthesizes an evidence-grounded comparative precedent report using RAG.
  - Returns: `{ summary, precedents: [...], similarities, differences, budgetComparison, recordedDecisions, implementationOutcomes, missingInformation, citations: [...], uncertaintyNotice }`
- `GET /api/ai/health`
  - Returns operational status of the AI service, active vector index count, embedding model, and configured LLM provider.

## 5. Administration & Audit
- `GET /api/departments`
  - List active departments.
- `GET /api/users`
  - List system users with role and department assignments.
- `POST /api/users`
  - Create user (System Admin only).
- `PATCH /api/users/:id`
  - Modify user status/role.
- `GET /api/audit-events`
  - Filterable audit logs with actor, action, timestamp, resourceId, and status.
- `GET /api/health`
  - System health, MongoDB status, FAISS index status, disk space.
