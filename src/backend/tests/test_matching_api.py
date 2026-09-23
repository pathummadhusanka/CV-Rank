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


def test_matching_endpoint_returns_not_found_when_cv_is_missing(
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

    response = client.post("/matching/jobs/job-1/cvs/missing")

    assert response.status_code == 404
    assert response.json() == {"detail": "CV not found"}


def test_ranking_endpoint_returns_candidates_in_score_order(
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
    candidates = [
        CV(
            id="cv-low",
            filename="low.pdf",
            file_path="storage/cvs/low.pdf",
            extracted_text="",
            skills="",
            experience_years=None,
            education=None,
            status="processed",
        ),
        CV(
            id="cv-high",
            filename="high.pdf",
            file_path="storage/cvs/high.pdf",
            extracted_text="Python SQL Docker",
            skills="python,sql,docker",
            experience_years=3,
            education="Bachelor",
            status="processed",
        ),
        CV(
            id="cv-mid",
            filename="mid.pdf",
            file_path="storage/cvs/mid.pdf",
            extracted_text="Python",
            skills="python",
            experience_years=None,
            education=None,
            status="processed",
        ),
    ]

    with test_session_factory() as session:
        session.add(job)
        session.add_all(candidates)
        session.commit()

    response = client.post("/matching/jobs/job-1")

    assert response.status_code == 200
    ranked = response.json()["candidates"]
    assert [candidate["cv_id"] for candidate in ranked] == [
        "cv-high",
        "cv-mid",
        "cv-low",
    ]
    assert [candidate["rank"] for candidate in ranked] == [1, 2, 3]
    assert [candidate["score"]["overall"] for candidate in ranked] == [
        100.0,
        20.0,
        0.0,
    ]


def test_ranking_endpoint_uses_cv_id_to_break_score_ties(
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
                    id="cv-b",
                    filename="b.pdf",
                    file_path="storage/cvs/b.pdf",
                    extracted_text="",
                    skills="",
                    experience_years=None,
                    education=None,
                    status="processed",
                ),
                CV(
                    id="cv-a",
                    filename="a.pdf",
                    file_path="storage/cvs/a.pdf",
                    extracted_text="",
                    skills="",
                    experience_years=None,
                    education=None,
                    status="processed",
                ),
            ]
        )
        session.commit()

    response = client.post("/matching/jobs/job-1")

    assert response.status_code == 200
    assert [candidate["cv_id"] for candidate in response.json()["candidates"]] == [
        "cv-a",
        "cv-b",
    ]


def test_ranking_endpoint_returns_empty_candidates_when_none_exist(
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

    response = client.post("/matching/jobs/job-1")

    assert response.status_code == 200
    assert response.json() == {"job_id": "job-1", "candidates": []}
