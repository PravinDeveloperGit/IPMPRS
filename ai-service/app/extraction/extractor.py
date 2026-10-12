import os
from pathlib import Path
from typing import List, Dict, Any

class DocumentExtractor:
    @staticmethod
    def extract_file(file_path: str, mime_type: str = "") -> List[Dict[str, Any]]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Source file not found at: {file_path}")

        ext = path.suffix.lower()
        pages = []

        if ext == ".pdf":
            pages = DocumentExtractor._extract_pdf(str(path))
        elif ext in [".docx", ".doc"]:
            pages = DocumentExtractor._extract_docx(str(path))
        else:
            pages = DocumentExtractor._extract_text(str(path))

        return pages

    @staticmethod
    def _extract_pdf(path: str) -> List[Dict[str, Any]]:
        pages = []
        try:
            try:
                import pymupdf as fitz
            except ImportError:
                import fitz
            doc = fitz.open(path)
            total_doc_pages = len(doc)
            for page_num in range(total_doc_pages):
                page = doc[page_num]
                text = page.get_text("text").strip()
                if text:
                    clean_text = "\n".join(line.strip() for line in text.split("\n") if line.strip())
                    pages.append({
                        "page_number": page_num + 1,
                        "text": clean_text,
                        "section_title": f"Page {page_num + 1}",
                    })
            doc.close()

            # If document has pages but no extractable text layer (e.g. scanned image-only PDF)
            if not pages and total_doc_pages > 0:
                for page_num in range(total_doc_pages):
                    pages.append({
                        "page_number": page_num + 1,
                        "text": f"[Scanned page {page_num + 1} - image-only layout, optical text extraction pending OCR]",
                        "section_title": f"Scanned Page {page_num + 1}",
                    })
        except Exception:
            pages = DocumentExtractor._extract_text(path)
        return pages


    @staticmethod
    def _extract_docx(path: str) -> List[Dict[str, Any]]:
        pages = []
        try:
            import docx
            doc = docx.Document(path)
            full_text = []
            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    full_text.append(text)
            combined = "\n\n".join(full_text)
            if combined:
                pages.append({
                    "page_number": 1,
                    "text": combined,
                    "section_title": "Document Body",
                })
        except Exception:
            pages = DocumentExtractor._extract_text(path)
        return pages

    @staticmethod
    def _extract_text(path: str) -> List[Dict[str, Any]]:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().strip()
                return [{
                    "page_number": 1,
                    "text": content,
                    "section_title": "Full Content",
                }]
        except Exception as e:
            return [{
                "page_number": 1,
                "text": f"Error reading text content: {str(e)}",
                "section_title": "Extraction Error",
            }]
