from types import SimpleNamespace

from app.services.matching_service import match_candidate
from app.services.scoring_service import calculate_score


def test_match_candidate_reports_skill_experience_and_education_results():
    candidate = SimpleNamespace(
        skills="Python, SQL",
        experience_years=4,
        education="Bachelor",
    )
    job = SimpleNamespace(
        required_skills="python,sql,docker",
        experience_years=3,
        education="bachelor",
    )

    result = match_candidate(candidate, job)

    assert result == {
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
    }


def test_calculate_score_applies_weighted_match_result():
    result = calculate_score(
        {
            "skills": {
                "matched": ["python", "sql"],
                "missing": ["docker"],
                "match_count": 2,
                "required_count": 3,
            },
            "experience": {"matched": True},
            "education": {"matched": True},
        }
    )

    assert result == {
        "skills": 66.67,
        "experience": 100.0,
        "education": 100.0,
        "overall": 80.0,
    }


def test_calculate_score_gives_full_skill_score_when_no_skills_are_required():
    result = calculate_score(
        {
            "skills": {
                "matched": [],
                "missing": [],
                "match_count": 0,
                "required_count": 0,
            },
            "experience": {"matched": False},
            "education": {"matched": False},
        }
    )

    assert result["skills"] == 100.0
    assert result["overall"] == 60.0
