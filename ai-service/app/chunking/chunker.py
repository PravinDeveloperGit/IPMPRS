from typing import List, Dict, Any

class TextChunker:
    @staticmethod
    def chunk_pages(pages: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
        chunks = []

        for page in pages:
            text = page.get("text", "")
            page_num = page.get("page_number", 1)
            section = page.get("section_title", f"Page {page_num}")

            if not text:
                continue

            # If text is shorter than chunk size, emit as single chunk
            if len(text) <= chunk_size:
                chunks.append({
                    "text": text,
                    "page_number": page_num,
                    "section_title": section,
                    "token_count": len(text.split()),
                })
                continue

            # Sliding window with overlap
            start = 0
            while start < len(text):
                end = start + chunk_size
                chunk_slice = text[start:end]

                # Attempt to split at clean sentence or paragraph boundary if possible
                if end < len(text):
                    last_period = chunk_slice.rfind(". ")
                    last_newline = chunk_slice.rfind("\n")
                    cut_point = max(last_period, last_newline)
                    if cut_point > chunk_size // 2:
                        chunk_slice = chunk_slice[:cut_point + 1]
                        end = start + cut_point + 1

                chunk_text = chunk_slice.strip()
                if chunk_text:
                    chunks.append({
                        "text": chunk_text,
                        "page_number": page_num,
                        "section_title": section,
                        "token_count": len(chunk_text.split()),
                    })

                start = end - overlap
                if start >= len(text) - overlap:
                    break

        return chunks
