import re


SKILLS = {
    "python",
    "fastapi",
    "django",
    "flask",
    "sql",
    "postgresql",
    "mysql",
    "sqlite",
    "machine learning",
    "deep learning",
    "tensorflow",
    "pytorch",
    "scikit-learn",
    "docker",
    "git",
    "aws",
}


def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()

    return [
        skill
        for skill in SKILLS
        if skill in text_lower
    ]


def extract_experience(text: str) -> int | None:
    match = re.search(
        r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)",
        text.lower(),
    )

    if match:
        return int(match.group(1))

    return None


def extract_education(text: str) -> str | None:
    education_keywords = [
        "bachelor's degree",
        "bachelor degree",
        "bachelor",
        "master's degree",
        "master degree",
        "master",
        "phd",
    ]

    text_lower = text.lower()

    for keyword in education_keywords:
        if keyword in text_lower:
            return keyword

    return None


def parse_job_description(text: str) -> dict:
    return {
        "skills": extract_skills(text),
        "experience_years": extract_experience(text),
        "education": extract_education(text),
    }