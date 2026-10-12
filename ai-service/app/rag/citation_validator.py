from typing import List, Dict, Any

class CitationValidator:
    @staticmethod
    def validate_citations(citations: List[Dict[str, Any]], retrieved_precedents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        valid_doc_titles = set()
        valid_prop_ids = set()

        for p in retrieved_precedents:
            doc_title = p.get("sourceDocument") or ""
            prop_id = p.get("proposalId") or ""
            if doc_title:
                valid_doc_titles.add(doc_title.lower())
            if prop_id:
                valid_prop_ids.add(prop_id.lower())

        validated = []
        for cite in citations:
            doc_title = (cite.get("documentTitle") or "").lower()
            prop_id = (cite.get("proposalId") or "").lower()

            # Verify presence in retrieved evidence
            is_valid = False
            if doc_title and any(doc_title in v or v in doc_title for v in valid_doc_titles):
                is_valid = True
            elif prop_id and prop_id in valid_prop_ids:
                is_valid = True

            validated.append({
                "documentTitle": cite.get("documentTitle", "Departmental Record"),
                "pageNumber": cite.get("pageNumber", 1),
                "proposalId": cite.get("proposalId"),
                "claim": cite.get("claim", ""),
                "isVerified": is_valid,
            })

        return validated
