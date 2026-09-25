from app.ai.errors import AIProviderError
from app.ai.schemas import (
    AICandidateAssessment,
    AIJobAnalysis,
    AIRequirement,
    MatchClassification,
    RequirementAssessment,
)
from app.ai.dependencies import get_ai_provider
from app.db.models import CV, Job


class FakeAnalysisProvider:
    def extract_requirements(self, job_description):
        return AIJobAnalysis(
            requirements=[
                AIRequirement(
                    description="Python backend development",
                    category="skill",
                    required=True,
                    weight=1.0,
                )
            ]
        )

    def assess_candidate(self, job_description, cv_text, requirements):
        classification = (
            MatchClassification.strong_match
            if "python" in cv_text.lower()
            else MatchClassification.no_evidence
        )
        return AICandidateAssessment(
            assessments=[
                RequirementAssessment(
                    requirement=requirements.requirements[0].description,
                    classification=classification,
                    evidence=["Python backend experience"] if classification == MatchClassification.strong_match else [],
                )
            ]
        )

    def embed(self, texts):
        return [[1.0, 0.0] for _ in texts]


class FailingAnalysisProvider:
    def extract_requirements(self, job_description):
        raise AIProviderError("provider unavailable")

    def assess_candidate(self, job_description, cv_text, requirements):
        raise AssertionError("assessment should not run")

    def embed(self, texts):
        raise AssertionError("embedding should not run")


def test_analysis_endpoint_returns_ai_backed_ranked_results(
    client,
    test_session_factory,
):
    with test_session_factory() as session:
        session.add(
            Job(
                id="job-1",
                title="Backend Engineer",
                description="Python backend role",
                required_skills="python",
                experience_years=None,
                education=None,
            )
        )
        session.add_all(
            [
                CV(
                    id="cv-low",
                    filename="low.pdf",
                    file_path="low.pdf",
                    extracted_text="Java developer",
                    skills="java",
                    experience_years=None,
                    education=None,
                    status="processed",
                ),
                CV(
                    id="cv-high",
                    filename="high.pdf",
                    file_path="high.pdf",
                    extracted_text="Python backend developer",
                    skills="python",
                    experience_years=None,
                    education=None,
                    status="processed",
                ),
            ]
        )
        session.commit()

    client.app.dependency_overrides[get_ai_provider] = lambda: FakeAnalysisProvider()
    response = client.post("/analysis/jobs/job-1")

    assert response.status_code == 200
    body = response.json()
    assert [candidate["cv_id"] for candidate in body["candidates"]] == [
        "cv-high",
        "cv-low",
    ]
    assert body["candidates"][0]["overall_score"] == 100.0
    assert body["candidates"][0]["matches"][0]["evidence"] == [
        "Python backend experience"
    ]


def test_analysis_endpoint_returns_empty_candidates(client, test_session_factory):
    with test_session_factory() as session:
        session.add(
            Job(
                id="job-1",
                title="Backend Engineer",
                description="Python backend role",
                required_skills="python",
                experience_years=None,
                education=None,
            )
        )
        session.commit()

    client.app.dependency_overrides[get_ai_provider] = lambda: FakeAnalysisProvider()
    response = client.post("/analysis/jobs/job-1")

    assert response.status_code == 200
    assert response.json()["candidates"] == []


def test_analysis_endpoint_returns_not_found_for_missing_job(client):
    client.app.dependency_overrides[get_ai_provider] = lambda: FakeAnalysisProvider()

    response = client.post("/analysis/jobs/missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "Job not found"}


def test_analysis_endpoint_returns_service_unavailable_on_provider_failure(
    client,
    test_session_factory,
):
    with test_session_factory() as session:
        session.add(
            Job(
                id="job-1",
                title="Backend Engineer",
                description="Python backend role",
                required_skills="python",
                experience_years=None,
                education=None,
            )
        )
        session.commit()

    client.app.dependency_overrides[get_ai_provider] = lambda: FailingAnalysisProvider()
    response = client.post("/analysis/jobs/job-1")

    assert response.status_code == 503
    assert response.json() == {
        "detail": "provider unavailable",
    }


def test_analysis_endpoint_returns_service_unavailable_without_api_key(
    client,
    test_session_factory,
):
    with test_session_factory() as session:
        session.add(
            Job(
                id="job-1",
                title="Backend Engineer",
                description="Python backend role",
                required_skills="python",
                experience_years=None,
                education=None,
            )
        )
        session.commit()

    response = client.post("/analysis/jobs/job-1")

    assert response.status_code == 503
    assert response.json() == {
        "detail": "AI provider configuration is missing",
        "code": "missing_api_key",
    }
