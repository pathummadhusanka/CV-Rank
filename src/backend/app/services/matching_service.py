def match_skills(
    candidate_skills: str,
    required_skills: str,
) -> dict:
    candidate = {
        skill.strip().lower()
        for skill in candidate_skills.split(",")
        if skill.strip()
    }

    required = {
        skill.strip().lower()
        for skill in required_skills.split(",")
        if skill.strip()
    }

    matched = candidate & required
    missing = required - candidate

    return {
        "matched": sorted(matched),
        "missing": sorted(missing),
        "match_count": len(matched),
        "required_count": len(required),
    }


def match_experience(
    candidate_years: int | None,
    required_years: int | None,
) -> dict:
    if required_years is None:
        return {
            "required": None,
            "candidate": candidate_years,
            "matched": True,
        }

    if candidate_years is None:
        return {
            "required": required_years,
            "candidate": None,
            "matched": False,
        }

    return {
        "required": required_years,
        "candidate": candidate_years,
        "matched": candidate_years >= required_years,
    }


def match_education(
    candidate_education: str | None,
    required_education: str | None,
) -> dict:
    if required_education is None:
        return {
            "required": None,
            "candidate": candidate_education,
            "matched": True,
        }

    if candidate_education is None:
        return {
            "required": required_education,
            "candidate": None,
            "matched": False,
        }

    return {
        "required": required_education,
        "candidate": candidate_education,
        "matched": candidate_education.lower()
        == required_education.lower(),
    }


def match_candidate(candidate, job) -> dict:
    return {
        "skills": match_skills(
            candidate.skills,
            job.required_skills,
        ),
        "experience": match_experience(
            candidate.experience_years,
            job.experience_years,
        ),
        "education": match_education(
            candidate.education,
            job.education,
        ),
    }


def rank_candidates(candidates, job, score_calculator) -> list[dict]:
    ranked = []

    for candidate in candidates:
        match = match_candidate(candidate, job)
        score = score_calculator(match)
        ranked.append(
            {
                "cv_id": candidate.id,
                "filename": candidate.filename,
                "match": match,
                "score": score,
            }
        )

    ranked.sort(
        key=lambda item: (-item["score"]["overall"], item["cv_id"]),
    )

    for rank, candidate in enumerate(ranked, start=1):
        candidate["rank"] = rank

    return ranked