import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR.parent / "backend" / "storage" / "documents"
INDEX_FILE = BASE_DIR / "vector_index.faiss"
METADATA_FILE = BASE_DIR / "vector_metadata.json"

# Pure Python .env loader to eliminate external package dependency issues
def _load_env_file(filepath: Path):
    if filepath.exists():
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

_load_env_file(BASE_DIR.parent / ".env")
_load_env_file(BASE_DIR / ".env")

PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))
HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
VECTOR_DIMENSION = 384

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock").lower()
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

