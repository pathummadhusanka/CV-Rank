from app.db.models import CV, Job


def test_matching_endpoint_returns_match_and_score(
    client,
    test_session_factory,
):
    job = Job(
        id="job-1",
        title="Backend Engineer",
        description="Python backend role",
        required_skills="python,sql,docker",
        experience_years=3,
        education="bachelor",
    )
    cv = CV(
        id="cv-1",
        filename="candidate.pdf",
        file_path="storage/cvs/candidate.pdf",
        extracted_text="Python and SQL developer",
        skills="python,sql",
        experience_years=4,
        education="Bachelor",
        status="processed",
    )

    with test_session_factory() as session:
        session.add_all([job, cv])
        session.commit()

    response = client.post("/matching/jobs/job-1/cvs/cv-1")

    assert response.status_code == 200
    assert response.json() == {
        "job_id": "job-1",
        "cv_id": "cv-1",
        "match": {
            "skills": {
                "matched": ["python", "sql"],
                "missing": ["docker"],
                "match_count": 2,
                "required_count": 3,
            },
            "experience": {
                "required": 3,
                "candidate": 4,
                "matched": True,
            },
            "education": {
                "required": "bachelor",
                "candidate": "Bachelor",
                "matched": True,
            },
        },
        "score": {
            "skills": 66.67,
            "experience": 100.0,
            "education": 100.0,
            "overall": 80.0,
        },
    }


def test_matching_endpoint_returns_not_found_for_missing_cv(client):
    response = client.post("/matching/jobs/missing/cvs/missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "Job not found"}
