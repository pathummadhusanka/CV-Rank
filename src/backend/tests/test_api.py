import json

from pydantic import SecretStr
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.app as app_module
import app.ai.openrouter_provider as openrouter_module
from app.db.models import Job


def test_health_check(client):
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "cv-rank"
    assert data["version"] == "0.1.0"
    assert data["status"] == "ok"
    assert "db_instance_id" in data


def test_ai_health_check_reports_missing_key(client, monkeypatch):
    monkeypatch.setattr(app_module.settings, "ai_api_key", None)

    response = client.get("/health/ai")

    assert response.status_code == 200
    assert response.json()["status"] == "missing_api_key"
    assert "not been configured" in response.json()["message"]


def test_ai_health_check_reports_ready_key(client, monkeypatch):
    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def read(self):
            return json.dumps({"data": {"limit_remaining": 12.5}}).encode()

    monkeypatch.setattr(app_module.settings, "ai_api_key", SecretStr("test-key"))
    monkeypatch.setattr(openrouter_module, "urlopen", lambda request, timeout: FakeResponse())

    response = client.get("/health/ai")

    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert response.json()["limit_remaining"] == 12.5


def test_create_job_persists_job(client, tmp_path):
    response = client.post(
        "/jobs",
        json={
            "title": "Backend Engineer",
            "description": "Python, FastAPI, and at least 3 years of experience.",
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["title"] == "Backend Engineer"
    assert result["status"] == "created"
    assert set(result["requirements"]["skills"]) == {"python", "fastapi"}
    assert result["requirements"]["experience_years"] == 3
    assert result["requirements"]["education"] is None

    database_url = f"sqlite:///{tmp_path / 'test.db'}"
    verification_engine = create_engine(database_url)
    with sessionmaker(bind=verification_engine)() as session:
        job = session.get(Job, result["id"])
        assert job is not None
        assert job.title == "Backend Engineer"
        assert set(job.required_skills.split(",")) == {"python", "fastapi"}
    verification_engine.dispose()


def test_create_job_requires_title(client):
    response = client.post(
        "/jobs",
        json={"description": "Python experience required."},
    )

    assert response.status_code == 422


def test_list_jobs_returns_created_jobs(client):
    create_response = client.post(
        "/jobs",
        json={
            "title": "Backend Engineer",
            "description": "Python and SQL experience required.",
        },
    )

    response = client.get("/jobs")

    assert response.status_code == 200
    assert response.json()[0]["id"] == create_response.json()["id"]
    assert response.json()[0]["title"] == "Backend Engineer"


def test_list_jobs_returns_empty_list_when_no_jobs_exist(client):
    response = client.get("/jobs")

    assert response.status_code == 200
    assert response.json() == []


def test_list_cvs_returns_processed_cv_summaries(client, test_session_factory):
    from app.db.models import CV

    with test_session_factory() as session:
        session.add(
            CV(
                id="cv-1",
                filename="candidate.pdf",
                file_path="storage/cvs/candidate.pdf",
                extracted_text="Python developer",
                skills="python",
                experience_years=2,
                education=None,
                status="processed",
            )
        )
        session.commit()

    response = client.get("/cvs")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "cv-1"
    assert response.json()[0]["filename"] == "candidate.pdf"
    assert response.json()[0]["status"] == "processed"


def test_list_cvs_returns_empty_list_when_no_cvs_exist(client):
    response = client.get("/cvs")

    assert response.status_code == 200
    assert response.json() == []
