class AIProviderError(RuntimeError):
    """Base error for controlled AI provider failures."""


class AIConfigurationError(AIProviderError):
    """Raised when required provider configuration is missing."""


class AIResponseError(AIProviderError):
    """Raised when a provider response cannot be validated."""