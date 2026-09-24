from typing import Protocol

from app.ai.schemas import AICandidateAssessment, AIJobAnalysis


class AIProvider(Protocol):
    def extract_requirements(self, job_description: str) -> AIJobAnalysis:
        ...

    def assess_candidate(
        self,
        job_description: str,
        cv_text: str,
        requirements: AIJobAnalysis,
    ) -> AICandidateAssessment:
        ...

    def embed(self, texts: list[str]) -> list[list[float]]:
        ...
