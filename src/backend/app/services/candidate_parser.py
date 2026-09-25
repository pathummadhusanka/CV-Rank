from app.services.job_parser import (
    extract_education,
    extract_experience,
    extract_skills,
)


def parse_candidate(text: str, terms=None) -> dict:
    return {
        "skills": extract_skills(text, terms),
        "experience_years": extract_experience(text),
        "education": extract_education(text),
    }