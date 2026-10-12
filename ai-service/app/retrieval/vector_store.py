import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from ..config import INDEX_FILE, METADATA_FILE, VECTOR_DIMENSION

class FAISSVectorStore:
    def __init__(self, persist: bool = True):
        self.dimension = VECTOR_DIMENSION
        self.persist = persist
        self.use_faiss = False
        self.index = None
        self.vectors_matrix = np.empty((0, self.dimension), dtype=np.float32)
        self.metadata: List[Dict[str, Any]] = []

        try:
            import faiss
            self.faiss = faiss
            self.index = faiss.IndexFlatIP(self.dimension)
            self.use_faiss = True
            print("[VectorStore] Native FAISS engine initialized.")
        except Exception as e:
            print(f"[VectorStore] Native FAISS blocked or unavailable ({e}). Using vectorized NumPy inner-product engine.")
            self.use_faiss = False

        if self.persist:
            self._load()

    @property
    def total_vectors(self) -> int:
        if self.use_faiss and self.index is not None:
            try:
                return int(self.index.ntotal)
            except Exception:
                pass
        return int(len(self.vectors_matrix))

    @property
    def ntotal(self) -> int:
        return self.total_vectors

    def __len__(self) -> int:
        return self.total_vectors

    def _load(self):
        if Path(METADATA_FILE).exists():
            try:
                with open(METADATA_FILE, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"[VectorStore] Metadata load error: {e}")

        # If NumPy vectors file exists
        vec_file = Path(str(INDEX_FILE) + ".npy")
        if vec_file.exists():
            try:
                self.vectors_matrix = np.load(str(vec_file))
                if self.use_faiss and self.index is not None and len(self.vectors_matrix) > 0:
                    self.index.add(self.vectors_matrix)
                print(f"[VectorStore] Restored {len(self.metadata)} vector chunks from storage.")
            except Exception as e:
                print(f"[VectorStore] Error reloading vectors: {e}")

    def save(self):
        if not self.persist:
            return
        try:
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(self.metadata, f, indent=2)
            np.save(str(INDEX_FILE) + ".npy", self.vectors_matrix)
        except Exception as e:
            print(f"[VectorStore] Error saving vectors: {e}")


    def add_vectors(self, embeddings: np.ndarray, chunks_metadata: List[Dict[str, Any]]) -> List[str]:
        if len(embeddings) == 0:
            return []

        # Unit L2 normalize
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normalized_embeddings = (embeddings / norms).astype(np.float32)

        start_idx = len(self.metadata)
        if len(self.vectors_matrix) == 0:
            self.vectors_matrix = normalized_embeddings
        else:
            self.vectors_matrix = np.vstack([self.vectors_matrix, normalized_embeddings])

        if self.use_faiss and self.index is not None:
            self.index.add(normalized_embeddings)

        ref_ids = []
        for i, meta in enumerate(chunks_metadata):
            ref_id = f"VEC-{start_idx + i:06d}"
            meta["vectorReference"] = ref_id
            self.metadata.append(meta)
            ref_ids.append(ref_id)

        self.save()
        return ref_ids

    def search(self, query_vector: np.ndarray, top_k: int = 5) -> List[Tuple[Dict[str, Any], float]]:
        if len(self.metadata) == 0 or len(self.vectors_matrix) == 0:
            return []

        # Normalize query vector
        q_norm = np.linalg.norm(query_vector)
        if q_norm > 0:
            query_vector = query_vector / q_norm

        if self.use_faiss and self.index is not None:
            try:
                query_mat = np.array([query_vector], dtype=np.float32)
                k = min(top_k, self.index.ntotal)
                scores, indices = self.index.search(query_mat, k)
                results = []
                for score, idx in zip(scores[0], indices[0]):
                    if idx != -1 and idx < len(self.metadata):
                        normalized_score = float(max(0.0, min(1.0, (score + 1.0) / 2.0)))
                        results.append((self.metadata[idx], normalized_score))
                return results
            except Exception:
                pass

        # Pure NumPy inner-product vector search
        dot_products = np.dot(self.vectors_matrix, query_vector)
        # Get top-k indices
        top_indices = np.argsort(dot_products)[::-1][:min(top_k, len(dot_products))]

        results = []
        for idx in top_indices:
            score = float(dot_products[idx])
            normalized_score = float(max(0.0, min(1.0, (score + 1.0) / 2.0)))
            results.append((self.metadata[idx], normalized_score))

        return results

    def clear(self):
        self.vectors_matrix = np.empty((0, self.dimension), dtype=np.float32)
        if self.use_faiss and self.index is not None:
            self.index = self.faiss.IndexFlatIP(self.dimension)
        self.metadata = []
        if self.persist:
            self.save()


# Global singleton
vector_store = FAISSVectorStore()
