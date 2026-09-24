import logging

from app.ai.errors import AIConfigurationError
from app.ai.hybrid_provider import HybridAIProvider
from app.ai.mock_provider import MockAIProvider
from app.ai.provider import AIProvider
from app.core.config import settings

logger = logging.getLogger("cv_rank.ai")


def get_ai_provider() -> AIProvider:
    logger.info("selecting ai provider=%s model=%s", settings.ai_provider, settings.ai_model)
    if settings.ai_provider == "mock":
        return MockAIProvider()
    if settings.ai_provider == "openrouter":
        return HybridAIProvider()
    raise AIConfigurationError(f"Unsupported AI provider: {settings.ai_provider}")
