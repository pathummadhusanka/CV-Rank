from dataclasses import dataclass
import re

from app.ai.errors import AIResponseError
from app.ai.provider import AIProvider
from app.ai.schemas import (
    AIAnalysisResult,
    AIJobAnalysis,
    AIRequirement,
    CandidateAnalysis,
    MatchClassification,
    RequirementMatch,
)
from app.ai.semantic import cosine_similarity

REQUIRED_SKILLS_WEIGHT = 0.40
PREFERRED_SKILLS_WEIGHT = 0.15
EXPERIENCE_WEIGHT = 0.25
SEMANTIC_WEIGHT = 0.20

CLASSIFICATION_VALUES = {
    MatchClassification.strong_match: 1.0,
    MatchClassification.partial_match: 0.5,
    MatchClassification.no_evidence: 0.0,
    MatchClassification.contradictory_evidence: 0.0,
}


@dataclass(frozen=True)
class CandidateDocument:
    cv_id: str
    filename: str
    text: str


def split_cv_text(text: str, max_chunk_length: int = 1200) -> list[str]:
    section_names = {
        "summary",
        "profile",
        "skills",
        "experience",
        "employment",
        "education",
        "projects",
        "certifications",
    }
    current_section = "general"
    sectioned_lines = []

    for line in text.splitlines():
        normalized = re.sub(r"[^a-z ]", "", line.lower()).strip()
        if normalized in section_names:
            current_section = normalized
            continue
        if line.strip():
            sectioned_lines.append(f"{current_section}: {line.strip()}")

    paragraphs = [paragraph.strip() for paragraph in "\n".join(sectioned_lines).split("\n\n") if paragraph.strip()]
    chunks = []

    for paragraph in paragraphs:
        chunks.extend(
            paragraph[index : index + max_chunk_length]
            for index in range(0, len(paragraph), max_chunk_length)
        )

    return chunks or ([text.strip()] if text.strip() else [])


class AIAnalysisService:
    def __init__(self, provider: AIProvider):
        self.provider = provider

    def analyze(
        self,
        job_description: str,
        candidates: list[CandidateDocument],
        requirements: AIJobAnalysis | None = None,
    ) -> AIAnalysisResult:
        if not job_description.strip():
            raise AIResponseError("Job description cannot be empty")

        requirements = requirements or self.extract_requirements(job_description)
        self._validate_requirements(requirements)
        results = [
            self._analyze_candidate(job_description, requirements, candidate)
            for candidate in candidates
        ]
        results.sort(key=lambda item: (-item.overall_score, item.cv_id))
        ranked = [candidate.model_copy(update={"rank": rank}) for rank, candidate in enumerate(results, 1)]

        return AIAnalysisResult(
            requirements=requirements.requirements,
            candidates=ranked,
        )

    def extract_requirements(self, job_description: str) -> AIJobAnalysis:
        requirements = self.provider.extract_requirements(job_description)
        self._validate_requirements(requirements)
        return requirements

    def _analyze_candidate(
        self,
        job_description: str,
        job_analysis: AIJobAnalysis,
        candidate: CandidateDocument,
    ) -> CandidateAnalysis:
        assessment = self.provider.assess_candidate(
            job_description,
            candidate.text,
            job_analysis,
        )
        assessment_by_requirement = {
            item.requirement: item for item in assessment.assessments
        }
        requirement_names = [item.description for item in job_analysis.requirements]
        if set(assessment_by_requirement) != set(requirement_names):
            raise AIResponseError("AI assessment did not cover every requirement")

        chunks = split_cv_text(candidate.text)
        vectors = self.provider.embed(
            requirement_names + chunks
        ) if chunks else []
        requirement_vectors = vectors[: len(requirement_names)]
        chunk_vectors = vectors[len(requirement_names) :]

        matches = []
        for index, requirement in enumerate(job_analysis.requirements):
            item = assessment_by_requirement[requirement.description]
            similarity = self._best_similarity(
                requirement_vectors[index],
                chunk_vectors,
            ) if chunk_vectors else 0.0
            matches.append(
                RequirementMatch(
                    requirement=requirement,
                    classification=item.classification,
                    evidence=item.evidence,
                    semantic_similarity=similarity,
                    match_value=CLASSIFICATION_VALUES[item.classification],
                )
            )

        required_score = self._component_score(
            matches,
            lambda match: match.requirement.category.lower() == "skill"
            and match.requirement.required,
        )
        preferred_score = self._component_score(
            matches,
            lambda match: match.requirement.category.lower() == "skill"
            and not match.requirement.required,
        )
        experience_score = self._component_score(
            matches,
            lambda match: match.requirement.category.lower() == "experience",
        )
        semantic_score = self._average_score(matches, lambda match: match.semantic_similarity)
        overall_score = round(
            required_score * REQUIRED_SKILLS_WEIGHT
            + preferred_score * PREFERRED_SKILLS_WEIGHT
            + experience_score * EXPERIENCE_WEIGHT
            + semantic_score * SEMANTIC_WEIGHT,
            2,
        )

        strengths = [
            match.requirement.description
            for match in matches
            if match.classification in {
                MatchClassification.strong_match,
                MatchClassification.partial_match,
            }
        ]
        gaps = [
            match.requirement.description
            for match in matches
            if match.classification in {
                MatchClassification.no_evidence,
                MatchClassification.contradictory_evidence,
            }
        ]

        return CandidateAnalysis(
            rank=1,
            cv_id=candidate.cv_id,
            filename=candidate.filename,
            required_skill_score=required_score,
            preferred_skill_score=preferred_score,
            experience_score=experience_score,
            semantic_similarity_score=semantic_score,
            overall_score=overall_score,
            matches=matches,
            strengths=strengths,
            gaps=gaps,
            explanation=self._build_explanation(overall_score, strengths, gaps),
        )

    @staticmethod
    def _validate_requirements(job_analysis: AIJobAnalysis) -> None:
        descriptions = [requirement.description for requirement in job_analysis.requirements]
        if not descriptions or len(descriptions) != len(set(descriptions)):
            raise AIResponseError("AI returned empty or duplicate requirements")

    @staticmethod
    def _best_similarity(requirement_vector, chunk_vectors) -> float:
        similarities = [
            max(0.0, cosine_similarity(requirement_vector, chunk_vector))
            for chunk_vector in chunk_vectors
        ]
        return round(max(similarities, default=0.0), 4)

    @staticmethod
    def _component_score(matches, predicate) -> float:
        selected = [match for match in matches if predicate(match)]
        if not selected:
            return 100.0
        return round(
            sum(match.match_value * match.requirement.weight for match in selected)
            / sum(match.requirement.weight for match in selected)
            * 100,
            2,
        )

    @staticmethod
    def _average_score(matches, selector) -> float:
        if not matches:
            return 100.0
        return round(sum(selector(match) for match in matches) / len(matches) * 100, 2)

    @staticmethod
    def _build_explanation(score, strengths, gaps) -> str:
        strength_text = ", ".join(strengths) or "no confirmed strengths"
        gap_text = ", ".join(gaps) or "no identified gaps"
        return f"Overall fit: {score}/100. Strengths: {strength_text}. Gaps: {gap_text}."
