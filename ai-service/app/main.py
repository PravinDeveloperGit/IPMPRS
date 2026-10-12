from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .config import PORT, HOST

app = FastAPI(
    title="IPMPRS AI Service",
    description="Evidence Extraction, Local Vector Embedding, and RAG Precedent Synthesis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {
        "service": "IPMPRS AI & Vector Retrieval Service",
        "jurisdiction": "Puducherry Police Hackathon 2026",
        "status": "OPERATIONAL",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
