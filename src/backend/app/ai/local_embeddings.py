import hashlib
import logging
import math
import re
from typing import Any

from sentence_transformers import SentenceTransformer

from app.ai.errors import AIProviderError
from app.core.config import Settings, settings

logger = logging.getLogger("cv_rank.ai.embeddings")
FALLBACK_DIMENSION = 256


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
            self.model = SentenceTransformer(
                provider_settings.ai_embedding_model,
                local_files_only=True,
            )
            self.using_fallback = False
        except Exception as exc:
            self.model = None
            self.using_fallback = True
            logger.warning(
                "local embedding model unavailable model=%s; using hash fallback error=%s",
                provider_settings.ai_embedding_model,
                exc,
            )

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        if self.using_fallback:
            return [self._hash_embedding(text) for text in texts]

        try:
            vectors = self.model.encode(texts, normalize_embeddings=True)
            return [vector.tolist() for vector in vectors]
        except Exception as exc:
            raise AIProviderError("Local embedding model failed") from exc

    @staticmethod
    def _hash_embedding(text: str) -> list[float]:
        vector = [0.0] * FALLBACK_DIMENSION
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % FALLBACK_DIMENSION
            vector[index] += 1.0

        magnitude = math.sqrt(sum(value * value for value in vector))
        if magnitude:
            vector = [value / magnitude for value in vector]
        return vector
