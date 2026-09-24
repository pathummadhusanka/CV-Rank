from app.ai.schemas import (
    AICandidateAssessment,
    AIJobAnalysis,
    AIRequirement,
    MatchClassification,
    RequirementAssessment,
)


class MockAIProvider:
    def extract_requirements(self, job_description: str) -> AIJobAnalysis:
        return AIJobAnalysis(
            requirements=[
                AIRequirement(
                    description="Python backend development",
                    category="skill",
                    required=True,
                    weight=0.6,
                ),
                AIRequirement(
                    description="Relevant professional experience",
                    category="experience",
                    required=False,
                    weight=0.4,
                ),
            ]
        )

    def assess_candidate(
        self,
        job_description: str,
        cv_text: str,
        requirements: AIJobAnalysis,
    ) -> AICandidateAssessment:
        return AICandidateAssessment(
            assessments=[
                RequirementAssessment(
                    requirement=requirement.description,
                    classification=MatchClassification.no_evidence,
                    evidence=[],
                )
                for requirement in requirements.requirements
            ]
        )

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [
            [float(len(text)), float(sum(text.lower().count(char) for char in "aeiou"))]
            for text in texts
        ]
