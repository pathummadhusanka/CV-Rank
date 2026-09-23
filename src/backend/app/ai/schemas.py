from enum import StrEnum

from pydantic import BaseModel, Field


class MatchClassification(StrEnum):
    strong_match = "strong_match"
    partial_match = "partial_match"
    no_evidence = "no_evidence"
    contradictory_evidence = "contradictory_evidence"


class AIRequirement(BaseModel):
    description: str = Field(min_length=1)
    category: str = Field(min_length=1)
    required: bool
    weight: float = Field(gt=0, le=1)


class AIJobAnalysis(BaseModel):
    requirements: list[AIRequirement]


class RequirementAssessment(BaseModel):
    requirement: str = Field(min_length=1)
    classification: MatchClassification
    evidence: list[str] = Field(default_factory=list)


class AICandidateAssessment(BaseModel):
    assessments: list[RequirementAssessment]
