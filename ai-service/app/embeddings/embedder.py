import numpy as np
import hashlib
from typing import List
from ..config import VECTOR_DIMENSION, EMBEDDING_MODEL_NAME

class LocalEmbedder:
    _model = None
    _is_sentence_transformer = False

    @classmethod
    def get_model(cls):
        if cls._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                cls._model = SentenceTransformer(EMBEDDING_MODEL_NAME)
                cls._is_sentence_transformer = True
                print(f"[Embedder] Loaded SentenceTransformer '{EMBEDDING_MODEL_NAME}' successfully.")
            except Exception as e:
                print(f"[Embedder] SentenceTransformer load bypassed ({e}). Using deterministic 384-dim normalized projection.")
                cls._is_sentence_transformer = False
                cls._model = "fallback"
        return cls._model

    @classmethod
    def embed_texts(cls, texts: List[str]) -> np.ndarray:
        cls.get_model()

        if cls._is_sentence_transformer and cls._model != "fallback":
            embeddings = cls._model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings.astype(np.float32)

        # Fallback deterministic normalized 384-dimension projection
        embeddings = []
        for text in texts:
            vec = np.zeros(VECTOR_DIMENSION, dtype=np.float32)
            words = text.lower().split()
            if not words:
                vec[0] = 1.0
                embeddings.append(vec)
                continue

            for word in words:
                # Hash word to dimensional bucket
                h = int(hashlib.md5(word.encode()).hexdigest(), 16)
                idx = h % VECTOR_DIMENSION
                sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
                vec[idx] += sign

            # L2 normalize
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            else:
                vec[0] = 1.0
            embeddings.append(vec)

        return np.array(embeddings, dtype=np.float32)

    @classmethod
    def embed_query(cls, query: str) -> np.ndarray:
        return cls.embed_texts([query])[0]
