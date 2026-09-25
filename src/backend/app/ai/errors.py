class AIProviderError(RuntimeError):
    """Base error for controlled AI provider failures."""

    def __init__(self, message: str, *, code: str = "provider_unavailable"):
        super().__init__(message)
        self.code = code


class AIConfigurationError(AIProviderError):
    """Raised when required provider configuration is missing."""

    def __init__(self, message: str = "AI provider configuration is missing"):
        super().__init__(message, code="missing_api_key")


class AIResponseError(AIProviderError):
    """Raised when a provider response cannot be validated."""