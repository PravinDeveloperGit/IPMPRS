from typing import Dict, Any, List
from ..providers.llm_adapter import LLMAdapter
from .citation_validator import CitationValidator

class RAGSynthesizer:
    @staticmethod
    def synthesize_report(proposal: Dict[str, Any], precedents: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not precedents:
            return {
                "proposalId": proposal.get("proposalId", "N/A"),
                "hasSufficientEvidence": False,
                "summary": "Insufficient evidence found in authorized departmental records matching this proposal scope.",
                "precedents": [],
                "similarities": [],
                "differences": [],
                "budgetComparison": None,
                "recordedDecisions": [],
                "implementationOutcomes": [],
                "missingInformation": ["No comparable historical departmental files located in current repository."],
                "citations": [],
                "uncertaintyNotice": "Semantic similarity is an evidential signal, not a guarantee or recommendation of departmental approval."
            }

        raw_report = LLMAdapter.generate_report(proposal, precedents)

        # Validate citations
        raw_citations = raw_report.get("citations", [])
        validated_citations = CitationValidator.validate_citations(raw_citations, precedents)
        raw_report["citations"] = validated_citations

        return raw_report
