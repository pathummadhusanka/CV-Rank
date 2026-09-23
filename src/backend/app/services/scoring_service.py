SKILLS_WEIGHT = 0.60
EXPERIENCE_WEIGHT = 0.25
EDUCATION_WEIGHT = 0.15


def calculate_skill_score(skill_match: dict) -> float:
    required_count = skill_match["required_count"]

    if required_count == 0:
        return 100.0

    return (
        skill_match["match_count"] / required_count
    ) * 100


def calculate_experience_score(experience_match: dict) -> float:
    if experience_match["matched"]:
        return 100.0

    return 0.0


def calculate_education_score(education_match: dict) -> float:
    if education_match["matched"]:
        return 100.0

    return 0.0


def calculate_score(match_result: dict) -> dict:
    skill_score = calculate_skill_score(
        match_result["skills"]
    )

    experience_score = calculate_experience_score(
        match_result["experience"]
    )

    education_score = calculate_education_score(
        match_result["education"]
    )

    overall_score = (
        skill_score * SKILLS_WEIGHT
        + experience_score * EXPERIENCE_WEIGHT
        + education_score * EDUCATION_WEIGHT
    )

    return {
        "skills": round(skill_score, 2),
        "experience": round(experience_score, 2),
        "education": round(education_score, 2),
        "overall": round(overall_score, 2),
    }