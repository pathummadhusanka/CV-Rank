from typing import Any

from sentence_transformers import SentenceTransformer

from app.ai.errors import AIProviderError
from app.core.config import Settings, settings


class LocalEmbeddingProvider:
    def __init__(
        self,
        provider_settings: Settings = settings,
        model: Any | None = None,
    ):
        self.provider_settings = provider_settings
        if model is not None:
            self.model = model
            return

        try:
            self.model = SentenceTransformer(provider_settings.ai_embedding_model)
        except Exception as exc:
            raise AIProviderError("Local embedding model could not be loaded") from exc

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        try:
            vectors = self.model.encode(texts, normalize_embeddings=True)
            return [vector.tolist() for vector in vectors]
        except Exception as exc:
            raise AIProviderError("Local embedding model failed") from exc
