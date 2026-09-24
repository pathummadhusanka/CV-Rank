from app.services.candidate_parser import parse_candidate
from app.services.job_parser import parse_job_description


def test_parse_job_description_extracts_requirements():
    result = parse_job_description(
        "Python and FastAPI developer with 3 years of experience. "
        "Bachelor's degree required."
    )

    assert set(result["skills"]) == {"python", "fastapi"}
    assert result["experience_years"] == 3
    assert result["education"] == "bachelor's degree"


def test_parse_candidate_returns_missing_optional_requirements_as_none():
    result = parse_candidate("Built SQL reports and used Git for version control.")

    assert set(result["skills"]) == {"sql", "git"}
    assert result["experience_years"] is None
    assert result["education"] is None
