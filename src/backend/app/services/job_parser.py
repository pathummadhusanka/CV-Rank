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


def extract_skills(text: str, terms=None) -> list[str]:
    text_lower = text.lower()
    if terms is None:
        terms = [{"term": skill, "aliases": ""} for skill in SKILLS]
    matched = []
    for item in terms:
        term = item["term"] if isinstance(item, dict) else item.term
        aliases = item.get("aliases", "") if isinstance(item, dict) else item.aliases
        if any(re.search(rf"(?<!\w){re.escape(value.strip().lower())}(?!\w)", text_lower) for value in [term, *aliases.split(",")]):
            matched.append(term)
    return matched


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


def parse_job_description(text: str, terms=None) -> dict:
    return {
        "skills": extract_skills(text, terms),
        "experience_years": extract_experience(text),
        "education": extract_education(text),
    }