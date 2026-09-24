from app.ai.local_embeddings import LocalEmbeddingProvider
from app.ai.openrouter_provider import OpenRouterProvider
from app.ai.schemas import AICandidateAssessment, AIJobAnalysis
from app.core.config import Settings, settings


class HybridAIProvider:
    def __init__(
        self,
        provider_settings: Settings = settings,
        llm_provider: OpenRouterProvider | None = None,
        embedding_provider: LocalEmbeddingProvider | None = None,
    ):
        self.llm_provider = llm_provider or OpenRouterProvider(provider_settings)
        self.embedding_provider = embedding_provider or LocalEmbeddingProvider(provider_settings)

    def extract_requirements(self, job_description: str) -> AIJobAnalysis:
        return self.llm_provider.extract_requirements(job_description)

    def assess_candidate(
        self,
        job_description: str,
        cv_text: str,
        requirements: AIJobAnalysis,
    ) -> AICandidateAssessment:
        return self.llm_provider.assess_candidate(
            job_description,
            cv_text,
            requirements,
        )

    def embed(self, texts: list[str]) -> list[list[float]]:
        return self.embedding_provider.embed(texts)
