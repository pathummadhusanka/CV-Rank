import pytest

from app.ai.analysis_service import AIAnalysisService, CandidateDocument, split_cv_text
from app.ai.errors import AIResponseError
from app.ai.schemas import (
    AICandidateAssessment,
    AIJobAnalysis,
    AIRequirement,
    MatchClassification,
    RequirementAssessment,
)


class AnalysisProvider:
    def extract_requirements(self, job_description):
        return AIJobAnalysis(
            requirements=[
                AIRequirement(
                    description="Python backend development",
                    category="skill",
                    required=True,
                    weight=0.4,
                ),
                AIRequirement(
                    description="Docker",
                    category="skill",
                    required=False,
                    weight=0.2,
                ),
                AIRequirement(
                    description="Relevant experience",
                    category="experience",
                    required=True,
                    weight=0.4,
                ),
            ]
        )

    def assess_candidate(self, job_description, cv_text, requirements):
        classification = (
            MatchClassification.strong_match
            if "strong" in cv_text
            else MatchClassification.no_evidence
        )
        return AICandidateAssessment(
            assessments=[
                RequirementAssessment(
                    requirement=requirement.description,
                    classification=classification,
                    evidence=["Relevant CV evidence"] if classification == MatchClassification.strong_match else [],
                )
                for requirement in requirements.requirements
            ]
        )

    def embed(self, texts):
        return [[0.0, 1.0] if "weak" in text else [1.0, 0.0] for text in texts]


class IncompleteProvider(AnalysisProvider):
    def assess_candidate(self, job_description, cv_text, requirements):
        return AICandidateAssessment(assessments=[])


class ReviewedRequirementsProvider(AnalysisProvider):
    def extract_requirements(self, job_description):
        raise AssertionError("reviewed requirements should bypass extraction")


def test_analysis_service_calculates_components_and_ranks_candidates():
    service = AIAnalysisService(AnalysisProvider())

    result = service.analyze(
        "Python backend role",
        [
            CandidateDocument("cv-low", "low.pdf", "weak candidate"),
            CandidateDocument("cv-high", "high.pdf", "strong candidate"),
        ],
    )

    assert [candidate.cv_id for candidate in result.candidates] == ["cv-high", "cv-low"]
    assert result.candidates[0].rank == 1
    assert result.candidates[0].overall_score == 100.0
    assert result.candidates[0].semantic_similarity_score == 100.0
    assert result.candidates[0].strengths == [
        "Python backend development",
        "Docker",
        "Relevant experience",
    ]
    assert result.candidates[1].overall_score == 0.0
    assert result.candidates[1].gaps == [
        "Python backend development",
        "Docker",
        "Relevant experience",
    ]


def test_analysis_service_requires_complete_ai_assessments():
    service = AIAnalysisService(IncompleteProvider())

    with pytest.raises(AIResponseError, match="cover every requirement"):
        service.analyze(
            "Python backend role",
            [CandidateDocument("cv-1", "candidate.pdf", "candidate text")],
        )


def test_analysis_service_uses_reviewed_requirements():
    service = AIAnalysisService(ReviewedRequirementsProvider())
    reviewed = AIJobAnalysis(
        requirements=[
            AIRequirement(
                description="Customer relationship management",
                category="skill",
                required=True,
                weight=1.0,
            )
        ]
    )

    result = service.analyze(
        "Sales role",
        [CandidateDocument("cv-1", "candidate.pdf", "CRM experience")],
        reviewed,
    )

    assert result.requirements == reviewed.requirements


def test_split_cv_text_uses_paragraphs_and_chunks_long_text():
    chunks = split_cv_text("Summary\n\n" + "Python " * 300, max_chunk_length=100)

    assert chunks[0] == "general: Summary"
    assert all(len(chunk) <= 100 for chunk in chunks)
