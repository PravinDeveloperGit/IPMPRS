from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class ExtractRequest(BaseModel):
    documentId: str
    filePath: str
    mimeType: Optional[str] = "application/pdf"
    originalFilename: Optional[str] = ""

class ExtractedChunk(BaseModel):
    text: str
    pageNumber: int = 1
    sectionTitle: str = "General Content"
    vectorReference: Optional[str] = None
    tokenCount: int = 0

class ExtractResponse(BaseModel):
    documentId: str
    pageCount: int
    chunks: List[ExtractedChunk]
    success: bool = True

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    departmentId: Optional[str] = None
    outcome: Optional[str] = None
    limit: int = 5

class SearchResultItem(BaseModel):
    proposalId: str = "PROP-HIST"
    id: Optional[str] = None
    title: str = "Historical Record"
    category: str = "General"
    departmentName: str = "Police Department"
    summary: str = ""
    score: float = 0.0
    outcome: str = "Approved"
    decidedAmount: Optional[float] = 0.0
    decisionReason: Optional[str] = ""
    implementationStatus: Optional[str] = ""
    implementationOutcome: Optional[str] = ""
    actualCost: Optional[float] = 0.0
    currency: str = "INR"
    isSynthetic: bool = False
    sourceDocument: Optional[str] = ""
    pageReference: Optional[int] = 1
    excerpt: Optional[str] = ""
    matchedTerms: List[str] = []

class SearchResponse(BaseModel):
    results: List[SearchResultItem] = []
    source: str = "FAISS_VECTOR_STORE"
    latencyMs: int = 15

class Citation(BaseModel):
    documentTitle: str = "Departmental Record"
    pageNumber: int = 1
    proposalId: Optional[str] = None
    claim: str = ""
    isVerified: bool = True

class BudgetComparison(BaseModel):
    proposedBudget: float = 0.0
    historicalAverageBudget: float = 0.0
    currency: str = "INR"
    variancePercent: float = 0.0

class RAGReportRequest(BaseModel):
    proposal: Dict[str, Any]
    precedents: List[Dict[str, Any]] = []

class RAGReportResponse(BaseModel):
    proposalId: str
    hasSufficientEvidence: bool = True
    summary: str
    precedents: List[Dict[str, Any]] = []
    similarities: List[str] = []
    differences: List[str] = []
    budgetComparison: Optional[BudgetComparison] = None
    recordedDecisions: List[Dict[str, Any]] = []
    implementationOutcomes: List[Dict[str, Any]] = []
    missingInformation: List[str] = []
    citations: List[Citation] = []
    uncertaintyNotice: str = ""

