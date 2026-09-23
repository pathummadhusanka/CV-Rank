import pytest
from pydantic import ValidationError

from app.ai.mock_provider import MockAIProvider
from app.ai.schemas import (
    AICandidateAssessment,
    AIJobAnalysis,
    AIRequirement,
    MatchClassification,
)
from app.core.config import Settings


def test_ai_job_analysis_requires_valid_requirement_weights():
    analysis = AIJobAnalysis(
        requirements=[
            AIRequirement(
                description="Python backend development",
                category="skill",
                required=True,
                weight=0.75,
            )
        ]
    )

    assert analysis.requirements[0].weight == 0.75

    with pytest.raises(ValidationError):
        AIRequirement(
            description="Python",
            category="skill",
            required=True,
            weight=0,
        )


def test_candidate_assessment_rejects_unknown_classification():
    with pytest.raises(ValidationError):
        AICandidateAssessment.model_validate(
            {
                "assessments": [
                    {
                        "requirement": "Python",
                        "classification": "keyword_match",
                        "evidence": [],
                    }
                ]
            }
        )


def test_mock_provider_returns_validated_ai_outputs():
    provider = MockAIProvider()

    analysis = provider.extract_requirements("Python backend role")
    assessment = provider.assess_candidate(
        "Python backend role",
        "Candidate CV text",
        analysis,
    )

    assert analysis.requirements
    assert len(assessment.assessments) == len(analysis.requirements)
    assert all(
        item.classification == MatchClassification.no_evidence
        for item in assessment.assessments
    )


def test_ai_settings_default_to_safe_local_mock():
    settings = Settings()

    assert settings.ai_provider == "mock"
    assert settings.ai_api_key is None
    assert settings.ai_model == "gpt-4o-mini"
