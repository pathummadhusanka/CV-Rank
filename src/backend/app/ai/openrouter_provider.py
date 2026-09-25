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

_last_runtime_ai_error: dict[str, Any] | None = None


def set_last_runtime_ai_error(status: str, message: str) -> None:
    global _last_runtime_ai_error
    _last_runtime_ai_error = {
        "status": status,
        "message": message,
        "time": perf_counter(),
    }


def get_last_runtime_ai_error() -> dict[str, Any] | None:
    global _last_runtime_ai_error
    if _last_runtime_ai_error and (perf_counter() - _last_runtime_ai_error.get("time", 0)) < 600:
        return _last_runtime_ai_error
    return None


def clear_last_runtime_ai_error() -> None:
    global _last_runtime_ai_error
    _last_runtime_ai_error = None


def classify_openrouter_error(exc: OpenAIError) -> AIProviderError:
    status_code = getattr(exc, "status_code", None)
    code_attr = getattr(exc, "code", None)
    body_attr = getattr(exc, "body", None)
    err_str = f"{exc} {status_code} {code_attr} {body_attr}".lower()

    if status_code == 401 or "401" in err_str or "invalid_api_key" in err_str or "invalid api key" in err_str:
        msg = "The OpenRouter API key is invalid. Ask the administrator to replace it."
        set_last_runtime_ai_error("invalid_api_key", msg)
        return AIProviderError(msg, code="invalid_api_key")

    if (
        status_code == 402
        or "402" in err_str
        or "credit" in err_str
        or "balance" in err_str
        or "quota" in err_str
        or "insufficient" in err_str
        or "exhausted" in err_str
    ):
        msg = "OpenRouter credits or the configured key limit have been exhausted."
        set_last_runtime_ai_error("credits_exhausted", msg)
        return AIProviderError(msg, code="credits_exhausted")

    if status_code == 403 or "403" in err_str or "forbidden" in err_str:
        msg = "The OpenRouter API key does not have permission to use this service."
        set_last_runtime_ai_error("forbidden", msg)
        return AIProviderError(msg, code="forbidden")

    if status_code == 429 or "429" in err_str or "rate_limit" in err_str or "rate limit" in err_str:
        msg = "OpenRouter is temporarily rate-limiting requests. Try again shortly."
        set_last_runtime_ai_error("rate_limited", msg)
        return AIProviderError(msg, code="rate_limited")

    msg = "OpenRouter is temporarily unavailable. Try again shortly."
    set_last_runtime_ai_error("provider_unavailable", msg)
    return AIProviderError(msg)


def check_openrouter_health(provider_settings: Settings = settings) -> dict[str, Any]:
    if provider_settings.ai_api_key is None:
        return {
            "provider": provider_settings.ai_provider,
            "model": provider_settings.ai_model,
            "status": "missing_api_key",
            "message": "The OpenRouter API key has not been configured.",
        }

    api_key_str = provider_settings.ai_api_key.get_secret_value()
    if not api_key_str.strip():
        return {
            "provider": provider_settings.ai_provider,
            "model": provider_settings.ai_model,
            "status": "missing_api_key",
            "message": "The OpenRouter API key is empty.",
        }

    base_url = provider_settings.ai_base_url.rstrip("/")
    # OpenRouter key info official URL is /auth/key
    urls_to_try = [
        f"{base_url}/auth/key" if not base_url.endswith("/auth") else f"{base_url}/key",
        f"{base_url}/key",
        "https://openrouter.ai/api/v1/auth/key",
    ]

    payload = None
    last_http_code = None

    for url in urls_to_try:
        request = Request(
            url,
            headers={
                "Authorization": f"Bearer {api_key_str}",
                "X-Title": provider_settings.ai_app_title,
            },
        )
        try:
            with urlopen(request, timeout=provider_settings.ai_timeout_seconds) as response:
                payload = json.loads(response.read())
                break
        except HTTPError as exc:
            last_http_code = exc.code
            if exc.code in (401, 402, 403, 429):
                break
        except (URLError, TimeoutError, JSONDecodeError, OSError):
            continue

    if payload is None:
        if last_http_code == 401:
            return {
                "provider": provider_settings.ai_provider,
                "model": provider_settings.ai_model,
                "status": "invalid_api_key",
                "message": "The OpenRouter API key is invalid.",
            }
        elif last_http_code == 402:
            return {
                "provider": provider_settings.ai_provider,
                "model": provider_settings.ai_model,
                "status": "credits_exhausted",
                "message": "OpenRouter credits or the key limit have been exhausted.",
            }
        elif last_http_code == 403:
            return {
                "provider": provider_settings.ai_provider,
                "model": provider_settings.ai_model,
                "status": "forbidden",
                "message": "The OpenRouter API key does not have permission to use this service.",
            }
        elif last_http_code == 429:
            return {
                "provider": provider_settings.ai_provider,
                "model": provider_settings.ai_model,
                "status": "rate_limited",
                "message": "OpenRouter is temporarily rate-limiting requests.",
            }

        runtime_err = get_last_runtime_ai_error()
        if runtime_err:
            return {
                "provider": provider_settings.ai_provider,
                "model": provider_settings.ai_model,
                "status": runtime_err["status"],
                "message": runtime_err["message"],
            }

        return {
            "provider": provider_settings.ai_provider,
            "model": provider_settings.ai_model,
            "status": "provider_unavailable",
            "message": "OpenRouter could not be reached. Try again shortly.",
        }

    data = payload.get("data", {}) if isinstance(payload, dict) else {}
    limit_remaining = data.get("limit_remaining") if isinstance(data, dict) else None
    usage = data.get("usage") if isinstance(data, dict) else None
    limit = data.get("limit") if isinstance(data, dict) else None
    is_active = data.get("is_active") if isinstance(data, dict) else None

    metadata = {
        "key_label": data.get("label") if isinstance(data, dict) else None,
        "usage": usage,
        "limit": limit,
        "is_active": is_active,
        "limit_reset": data.get("limit_reset") if isinstance(data, dict) else None,
        "limit_remaining": limit_remaining,
    }

    # Check for exhausted credits or limits:
    is_exhausted = False
    if isinstance(limit_remaining, (int, float)) and limit_remaining <= 0:
        is_exhausted = True
    elif isinstance(limit, (int, float)) and limit > 0 and isinstance(usage, (int, float)) and usage >= limit:
        is_exhausted = True
    elif is_active is False:
        is_exhausted = True

    if is_exhausted:
        return {
            "provider": provider_settings.ai_provider,
            "model": provider_settings.ai_model,
            "status": "credits_exhausted",
            "message": "OpenRouter credits or the configured key limit have been exhausted.",
            **metadata,
        }

    runtime_err = get_last_runtime_ai_error()
    if runtime_err:
        return {
            "provider": provider_settings.ai_provider,
            "model": provider_settings.ai_model,
            "status": runtime_err["status"],
            "message": runtime_err["message"],
            **metadata,
        }

    clear_last_runtime_ai_error()
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
            raise AIConfigurationError()

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
            "Extract job-relevant required and preferred requirements into 4 clear categories: 'skill', 'experience', 'domain', or 'education'. "
            "Return JSON with a requirements array. Each item must contain "
            "description, category, required, and weight (float between 0.1 and 1.0). Do not invent requirements.",
            job_description,
        )
        repaired_weights = 0
        requirements = payload.get("requirements", [])
        if isinstance(requirements, list):
            for requirement in requirements:
                if isinstance(requirement, dict):
                    if requirement.get("weight") is None:
                        requirement["weight"] = 0.7 if requirement.get("required", True) else 0.3
                        repaired_weights += 1
                    if not requirement.get("category"):
                        requirement["category"] = "skill"
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
            "Each array item must contain requirement, classification, evidence, and reasoning. Use exactly one "
            "classification: strong_match, partial_match, no_evidence, or "
            "contradictory_evidence. Evidence must be verbatim text quotes copied directly from the CV text with section context where applicable (e.g. '[Work Experience] 3 years developing Python APIs'). Reasoning must be a concise 1-sentence explanation of why the classification was given. Evidence must always be a JSON array of strings.",
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
                    "reasoning": "",
                }
                for requirement, value in keyed_assessment.items()
            ]
            logger.warning("llm assessment used keyed object; normalized to assessments array")

        assessments = payload.get("assessments")
        if isinstance(assessments, list):
            repaired_evidence = 0
            for assessment in assessments:
                if isinstance(assessment, dict):
                    if isinstance(assessment.get("evidence"), str):
                        assessment["evidence"] = [assessment["evidence"]]
                        repaired_evidence += 1
                    if not isinstance(assessment.get("reasoning"), str):
                        assessment["reasoning"] = ""
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
