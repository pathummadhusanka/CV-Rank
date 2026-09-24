import json
import logging
from json import JSONDecodeError
from time import perf_counter
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from openai import OpenAI
from openai import OpenAIError
from pydantic import ValidationError

from app.ai.errors import AIConfigurationError, AIProviderError, AIResponseError
from app.ai.schemas import AICandidateAssessment, AIJobAnalysis
from app.core.config import Settings, settings

logger = logging.getLogger("cv_rank.ai.openrouter")


def classify_openrouter_error(exc: OpenAIError) -> AIProviderError:
    status_code = getattr(exc, "status_code", None)
    if status_code == 401:
        return AIProviderError(
            "The OpenRouter API key is invalid. Ask the administrator to replace it.",
            code="invalid_api_key",
        )
    if status_code == 402:
        return AIProviderError(
            "OpenRouter credits or the configured key limit have been exhausted.",
            code="credits_exhausted",
        )
    if status_code == 403:
        return AIProviderError(
            "The OpenRouter API key does not have permission to use this service.",
            code="forbidden",
        )
    if status_code == 429:
        return AIProviderError(
            "OpenRouter is temporarily rate-limiting requests. Try again shortly.",
            code="rate_limited",
        )
    return AIProviderError("OpenRouter is temporarily unavailable. Try again shortly.")


def check_openrouter_health(provider_settings: Settings = settings) -> dict[str, Any]:
    if provider_settings.ai_api_key is None:
        return {
            "provider": provider_settings.ai_provider,
            "model": provider_settings.ai_model,
            "status": "missing_api_key",
            "message": "The OpenRouter API key has not been configured.",
        }

    request = Request(
        f"{provider_settings.ai_base_url.rstrip('/')}/key",
        headers={
            "Authorization": f"Bearer {provider_settings.ai_api_key.get_secret_value()}",
            "X-Title": provider_settings.ai_app_title,
        },
    )
    try:
        with urlopen(request, timeout=provider_settings.ai_timeout_seconds) as response:
            payload = json.loads(response.read())
    except HTTPError as exc:
        status_code = exc.code
        if status_code == 401:
            status, message = "invalid_api_key", "The OpenRouter API key is invalid."
        elif status_code == 402:
            status, message = "credits_exhausted", "OpenRouter credits or the key limit have been exhausted."
        elif status_code == 403:
            status, message = "forbidden", "The OpenRouter API key does not have permission to use this service."
        elif status_code == 429:
            status, message = "rate_limited", "OpenRouter is temporarily rate-limiting requests."
        else:
            status, message = "provider_unavailable", "OpenRouter could not be reached. Try again shortly."
        return {"provider": provider_settings.ai_provider, "model": provider_settings.ai_model, "status": status, "message": message}
    except (URLError, TimeoutError, JSONDecodeError, OSError):
        return {
            "provider": provider_settings.ai_provider,
            "model": provider_settings.ai_model,
            "status": "provider_unavailable",
            "message": "OpenRouter could not be reached. Try again shortly.",
        }

    data = payload.get("data", {}) if isinstance(payload, dict) else {}
    limit_remaining = data.get("limit_remaining") if isinstance(data, dict) else None
    metadata = {
        "key_label": data.get("label") if isinstance(data, dict) else None,
        "usage": data.get("usage") if isinstance(data, dict) else None,
        "limit": data.get("limit") if isinstance(data, dict) else None,
        "is_active": data.get("is_active") if isinstance(data, dict) else None,
        "limit_reset": data.get("limit_reset") if isinstance(data, dict) else None,
        "limit_remaining": limit_remaining,
    }
    if isinstance(limit_remaining, (int, float)) and limit_remaining <= 0:
        return {
            "provider": provider_settings.ai_provider,
            "model": provider_settings.ai_model,
            "status": "credits_exhausted",
            "message": "OpenRouter credits or the configured key limit have been exhausted.",
            **metadata,
        }
    return {
        "provider": provider_settings.ai_provider,
        "model": provider_settings.ai_model,
        "status": "ready",
        "message": "AI analysis is ready.",
        **metadata,
    }


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
            "extract_requirements",
            "Extract job-relevant required and preferred requirements. "
            "Return JSON with a requirements array. Each item must contain "
            "description, category, required, and weight. Do not invent requirements.",
            job_description,
        )
        repaired_weights = 0
        requirements = payload.get("requirements", [])
        if isinstance(requirements, list):
            for requirement in requirements:
                if isinstance(requirement, dict) and requirement.get("weight") is None:
                    requirement["weight"] = 0.7 if requirement.get("required", True) else 0.3
                    repaired_weights += 1
        if repaired_weights:
            logger.warning(
                "llm requirements contained null weights; applied defaults count=%s",
                repaired_weights,
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
            "assess_candidate",
            "Return JSON with an assessments array that assesses every supplied requirement against the CV. "
            "Each array item must contain requirement, classification, and evidence. Use exactly one "
            "classification: strong_match, partial_match, no_evidence, or "
            "contradictory_evidence. Include concise evidence and do not calculate "
            "an aggregate score. Evidence must always be a JSON array of strings, "
            "including when there is only one item.",
            json.dumps(prompt),
        )
        keyed_assessment = payload.get("assessment")
        if "assessments" not in payload and isinstance(keyed_assessment, dict):
            payload["assessments"] = [
                {
                    "requirement": requirement,
                    **value,
                }
                if isinstance(value, dict)
                else {
                    "requirement": requirement,
                    "classification": value,
                    "evidence": [],
                }
                for requirement, value in keyed_assessment.items()
            ]
            logger.warning("llm assessment used keyed object; normalized to assessments array")

        assessments = payload.get("assessments")
        if isinstance(assessments, list):
            repaired_evidence = 0
            for assessment in assessments:
                if isinstance(assessment, dict) and isinstance(assessment.get("evidence"), str):
                    assessment["evidence"] = [assessment["evidence"]]
                    repaired_evidence += 1
            if repaired_evidence:
                logger.warning(
                    "llm assessment contained string evidence; normalized to lists count=%s",
                    repaired_evidence,
                )

        try:
            return AICandidateAssessment.model_validate(payload)
        except ValidationError as exc:
            raise AIResponseError("OpenRouter returned invalid candidate assessment") from exc

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        started_at = perf_counter()
        logger.info("llm embedding started model=%s inputs=%s", self.provider_settings.ai_embedding_model, len(texts))
        try:
            response = self.client.embeddings.create(
                model=self.provider_settings.ai_embedding_model,
                input=texts,
            )
        except OpenAIError as exc:
            logger.exception("llm embedding failed model=%s", self.provider_settings.ai_embedding_model)
            raise classify_openrouter_error(exc) from exc

        try:
            embeddings = [item.embedding for item in sorted(response.data, key=lambda item: item.index)]
            logger.info(
                "llm embedding completed model=%s outputs=%s duration_ms=%.1f",
                self.provider_settings.ai_embedding_model,
                len(embeddings),
                (perf_counter() - started_at) * 1000,
            )
            return embeddings
        except (AttributeError, TypeError) as exc:
            raise AIResponseError("OpenRouter returned invalid embeddings") from exc

    def _request_json(self, operation: str, instruction: str, content: str) -> dict[str, Any]:
        started_at = perf_counter()
        logger.info("llm chat started operation=%s model=%s", operation, self.provider_settings.ai_model)
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
            logger.exception("llm chat failed operation=%s model=%s", operation, self.provider_settings.ai_model)
            raise classify_openrouter_error(exc) from exc

        try:
            message = response.choices[0].message.content
            if not message:
                raise ValueError("empty response")
            payload = json.loads(message)
            if not isinstance(payload, dict):
                raise ValueError("response was not an object")
            logger.info(
                "llm chat completed operation=%s model=%s duration_ms=%.1f",
                operation,
                self.provider_settings.ai_model,
                (perf_counter() - started_at) * 1000,
            )
            return payload
        except (AttributeError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise AIResponseError("OpenRouter returned invalid JSON") from exc
