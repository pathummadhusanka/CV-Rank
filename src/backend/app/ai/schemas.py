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
    reasoning: str = ""


class AICandidateAssessment(BaseModel):
    assessments: list[RequirementAssessment]


class RequirementMatch(BaseModel):
    requirement: AIRequirement
    classification: MatchClassification
    evidence: list[str] = Field(default_factory=list)
    reasoning: str = ""
    semantic_similarity: float = Field(ge=0, le=1)
    match_value: float = Field(ge=0, le=1)


class CandidateAnalysis(BaseModel):
    rank: int = Field(ge=1)
    cv_id: str = Field(min_length=1)
    filename: str = Field(min_length=1)
    required_skill_score: float = Field(ge=0, le=100)
    preferred_skill_score: float = Field(ge=0, le=100)
    experience_score: float = Field(ge=0, le=100)
    project_score: float = Field(ge=0, le=100, default=100.0)
    semantic_similarity_score: float = Field(ge=0, le=100)
    overall_score: float = Field(ge=0, le=100)
    matches: list[RequirementMatch]
    strengths: list[str]
    gaps: list[str]
    explanation: str = Field(min_length=1)
    executive_summary: str = ""
    interview_questions: list[str] = Field(default_factory=list)


class AIAnalysisResult(BaseModel):
    requirements: list[AIRequirement]
    candidates: list[CandidateAnalysis]
