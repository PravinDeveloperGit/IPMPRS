import time
from fastapi import APIRouter, HTTPException
from ..schemas.models import (
    ExtractRequest,
    ExtractResponse,
    ExtractedChunk,
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    RAGReportRequest,
    RAGReportResponse,
)
from ..extraction.extractor import DocumentExtractor
from ..chunking.chunker import TextChunker
from ..embeddings.embedder import LocalEmbedder
from ..retrieval.vector_store import vector_store
from ..rag.synthesizer import RAGSynthesizer
from ..config import EMBEDDING_MODEL_NAME, LLM_PROVIDER, LLM_MODEL

router = APIRouter()

@router.post("/extract", response_model=ExtractResponse)
async def extract_document(req: ExtractRequest):
    try:
        pages = DocumentExtractor.extract_file(req.filePath, req.mimeType)
        if not pages:
            return ExtractResponse(
                documentId=req.documentId,
                pageCount=0,
                chunks=[],
                success=True,
            )

        raw_chunks = TextChunker.chunk_pages(pages)
        if not raw_chunks:
            return ExtractResponse(
                documentId=req.documentId,
                pageCount=len(pages),
                chunks=[],
                success=True,
            )

        # Generate embeddings
        texts = [c["text"] for c in raw_chunks]
        embeddings = LocalEmbedder.embed_texts(texts)

        # Add to vector store
        chunks_metadata = []
        for i, c in enumerate(raw_chunks):
            chunks_metadata.append({
                "documentId": req.documentId,
                "chunkIndex": i,
                "text": c["text"],
                "pageNumber": c["page_number"],
                "sectionTitle": c["section_title"],
                "originalFilename": req.originalFilename,
            })

        vector_refs = vector_store.add_vectors(embeddings, chunks_metadata)

        extracted_chunks = []
        for i, c in enumerate(raw_chunks):
            extracted_chunks.append(ExtractedChunk(
                text=c["text"],
                pageNumber=c["page_number"],
                sectionTitle=c["section_title"],
                vectorReference=vector_refs[i] if i < len(vector_refs) else None,
                tokenCount=c["token_count"],
            ))

        return ExtractResponse(
            documentId=req.documentId,
            pageCount=len(pages),
            chunks=extracted_chunks,
            success=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@router.post("/search", response_model=SearchResponse)
async def search_precedents(req: SearchRequest):
    start = time.time()
    try:
        query_vec = LocalEmbedder.embed_query(req.query)
        matches = vector_store.search(query_vec, top_k=req.limit * 2)

        results = []
        for meta, score in matches:
            if req.category and meta.get("category") and meta.get("category") != req.category:
                continue

            decided_amount = meta.get("decidedAmount")
            actual_cost = meta.get("actualCost")
            page_ref = meta.get("pageReference") or meta.get("pageNumber") or 1

            results.append(SearchResultItem(
                proposalId=meta.get("proposalId", "PROP-HIST"),
                id=meta.get("id"),
                title=meta.get("title") or meta.get("originalFilename") or "Historical Document",
                category=meta.get("category", "General"),
                departmentName=meta.get("departmentName", "Police Headquarters"),
                summary=meta.get("summary") or meta.get("text", "")[:240],
                score=round(float(score), 2),
                outcome=meta.get("outcome", "Approved"),
                decidedAmount=float(decided_amount) if decided_amount is not None else 0.0,
                decisionReason=meta.get("decisionReason") or "Sanctioned pursuant to guidelines.",
                implementationStatus=meta.get("implementationStatus") or "Implemented",
                implementationOutcome=meta.get("implementationOutcome") or "Operational in field.",
                actualCost=float(actual_cost) if actual_cost is not None else 0.0,
                currency=meta.get("currency", "INR"),
                isSynthetic=bool(meta.get("isSynthetic", False)),
                sourceDocument=meta.get("sourceDocument") or meta.get("originalFilename") or meta.get("documentTitle", "Document"),
                pageReference=int(page_ref) if str(page_ref).isdigit() else 1,
                excerpt=meta.get("text", "")[:240],
                matchedTerms=req.query.lower().split()[:3],
            ))

            if len(results) >= req.limit:
                break

        latency = int((time.time() - start) * 1000)
        return SearchResponse(
            results=results,
            source="FAISS_VECTOR_STORE" if vector_store.use_faiss else "NUMPY_VECTOR_STORE",
            latencyMs=max(1, latency),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/rag/report", response_model=RAGReportResponse)
async def generate_rag_report(req: RAGReportRequest):
    try:
        report = RAGSynthesizer.synthesize_report(req.proposal, req.precedents)
        return RAGReportResponse(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG synthesis failed: {str(e)}")

@router.get("/health")
async def health_check():
    return {
        "status": "UP",
        "service": "IPMPRS AI & Vector Retrieval Service",
        "vectorCount": vector_store.total_vectors,
        "engine": "FAISS" if vector_store.use_faiss else "NumPy-Vectorized",
        "embeddingModel": EMBEDDING_MODEL_NAME,
        "llmProvider": LLM_PROVIDER,
        "llmModel": LLM_MODEL,
    }

