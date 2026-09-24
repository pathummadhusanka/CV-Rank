import json
from types import SimpleNamespace

import pytest
from pydantic import SecretStr

from app.ai.errors import AIConfigurationError, AIResponseError
from app.ai.openrouter_provider import OpenRouterProvider
from app.ai.schemas import AIJobAnalysis
from app.ai.semantic import EmbeddingError, cosine_similarity
from app.core.config import Settings


class FakeClient:
    def __init__(self, chat_payload):
        self.chat_payload = chat_payload
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self.create_chat))
        self.embeddings = SimpleNamespace(create=self.create_embeddings)

    def create_chat(self, **kwargs):
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content=json.dumps(self.chat_payload))
                )
            ]
        )

    def create_embeddings(self, **kwargs):
        return SimpleNamespace(
            data=[
                SimpleNamespace(index=1, embedding=[0.0, 1.0]),
                SimpleNamespace(index=0, embedding=[1.0, 0.0]),
            ]
        )


def provider_with(fake_client):
    return OpenRouterProvider(
        Settings(ai_api_key=SecretStr("test-key")),
        client=fake_client,
    )


def test_openrouter_provider_validates_chat_and_embedding_outputs():
    provider = provider_with(
        FakeClient(
            {
                "requirements": [
                    {
                        "description": "Python backend development",
                        "category": "skill",
                        "required": True,
                        "weight": 0.7,
                    }
                ]
            }
        )
    )

    requirements = provider.extract_requirements("Python backend role")
    assessment_provider = provider_with(
        FakeClient(
            {
                "assessments": [
                    {
                        "requirement": "Python backend development",
                        "classification": "strong_match",
                        "evidence": ["Built Python APIs"],
                    }
                ]
            }
        )
    )
    assessment = assessment_provider.assess_candidate(
        "Python backend role",
        "Built Python APIs",
        requirements,
    )

    assert requirements.requirements[0].required is True
    assert assessment.assessments[0].evidence == ["Built Python APIs"]
    assert provider.embed(["job", "cv"]) == [[1.0, 0.0], [0.0, 1.0]]


def test_openrouter_provider_requires_api_key_without_injected_client():
    with pytest.raises(AIConfigurationError):
        OpenRouterProvider(Settings())


def test_openrouter_provider_rejects_malformed_json():
    class MalformedClient(FakeClient):
        def create_chat(self, **kwargs):
            return SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content="not json"))]
            )

    provider = provider_with(MalformedClient({}))

    with pytest.raises(AIResponseError):
        provider.extract_requirements("Python backend role")


def test_cosine_similarity_is_bounded_and_validates_dimensions():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0

    with pytest.raises(EmbeddingError):
        cosine_similarity([1.0], [1.0, 0.0])
