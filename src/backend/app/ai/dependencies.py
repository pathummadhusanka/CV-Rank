from app.ai.errors import AIConfigurationError
from app.ai.hybrid_provider import HybridAIProvider
from app.ai.mock_provider import MockAIProvider
from app.ai.provider import AIProvider
from app.core.config import settings


def get_ai_provider() -> AIProvider:
    if settings.ai_provider == "mock":
        return MockAIProvider()
    if settings.ai_provider == "openrouter":
        return HybridAIProvider()
    raise AIConfigurationError(f"Unsupported AI provider: {settings.ai_provider}")
