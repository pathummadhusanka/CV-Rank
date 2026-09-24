import json
from typing import Any

from openai import OpenAI
from openai import OpenAIError
from pydantic import ValidationError

from app.ai.errors import AIConfigurationError, AIProviderError, AIResponseError
from app.ai.schemas import AICandidateAssessment, AIJobAnalysis
from app.core.config import Settings, settings


class OpenRouterProvider:
    def __init__(
        self,
        provider_settings: Settings = settings,
        client: Any | None = None,
    ):
        if client is not None:
            self.client = client
            self.provider_settings = provider_settings
            return

        if provider_settings.ai_api_key is None:
            raise AIConfigurationError("AI_API_KEY is required for OpenRouter")

        headers = {"X-Title": provider_settings.ai_app_title}
        if provider_settings.ai_http_referer:
            headers["HTTP-Referer"] = provider_settings.ai_http_referer

        self.client = OpenAI(
            api_key=provider_settings.ai_api_key.get_secret_value(),
            base_url=provider_settings.ai_base_url,
            default_headers=headers,
            timeout=provider_settings.ai_timeout_seconds,
        )
        self.provider_settings = provider_settings

    def extract_requirements(self, job_description: str) -> AIJobAnalysis:
        payload = self._request_json(
            "Extract job-relevant required and preferred requirements. "
            "Return JSON with a requirements array. Each item must contain "
            "description, category, required, and weight. Do not invent requirements.",
            job_description,
        )

        try:
            return AIJobAnalysis.model_validate(payload)
        except ValidationError as exc:
            raise AIResponseError("OpenRouter returned invalid job requirements") from exc

    def assess_candidate(
        self,
        job_description: str,
        cv_text: str,
        requirements: AIJobAnalysis,
    ) -> AICandidateAssessment:
        prompt = {
            "job_description": job_description,
            "requirements": requirements.model_dump(mode="json"),
            "cv_text": cv_text,
        }
        payload = self._request_json(
            "Assess every supplied requirement against the CV. Use exactly one "
            "classification: strong_match, partial_match, no_evidence, or "
            "contradictory_evidence. Include concise evidence and do not calculate "
            "an aggregate score.",
            json.dumps(prompt),
        )

        try:
            return AICandidateAssessment.model_validate(payload)
        except ValidationError as exc:
            raise AIResponseError("OpenRouter returned invalid candidate assessment") from exc

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        try:
            response = self.client.embeddings.create(
                model=self.provider_settings.ai_embedding_model,
                input=texts,
            )
        except OpenAIError as exc:
            raise AIProviderError("OpenRouter embedding request failed") from exc

        try:
            return [item.embedding for item in sorted(response.data, key=lambda item: item.index)]
        except (AttributeError, TypeError) as exc:
            raise AIResponseError("OpenRouter returned invalid embeddings") from exc

    def _request_json(self, instruction: str, content: str) -> dict[str, Any]:
        try:
            response = self.client.chat.completions.create(
                model=self.provider_settings.ai_model,
                messages=[
                    {"role": "system", "content": instruction},
                    {"role": "user", "content": content},
                ],
                response_format={"type": "json_object"},
            )
        except OpenAIError as exc:
            raise AIProviderError("OpenRouter chat request failed") from exc

        try:
            message = response.choices[0].message.content
            if not message:
                raise ValueError("empty response")
            payload = json.loads(message)
            if not isinstance(payload, dict):
                raise ValueError("response was not an object")
            return payload
        except (AttributeError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise AIResponseError("OpenRouter returned invalid JSON") from exc
