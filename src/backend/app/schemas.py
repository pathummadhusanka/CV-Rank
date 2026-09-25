from datetime import datetime

from pydantic import BaseModel


class Requirements(BaseModel):
    skills: list[str]
    experience_years: int | None
    education: str | None


class JobCreateResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    requirements: Requirements


class JobSummary(BaseModel):
    id: str
    title: str
    description: str
    required_skills: str
    experience_years: int | None
    education: str | None
    created_at: datetime


class ExtractionTermResponse(BaseModel):
    id: int
    term: str
    aliases: str
    category: str
    enabled: bool


class ExtractionTermRequest(BaseModel):
    term: str
    aliases: str = ""
    category: str = "skill"
    enabled: bool = True


class CVUploadResponse(BaseModel):
    id: str
    filename: str
    status: str


class CVSummary(BaseModel):
    id: str
    filename: str
    skills: str
    experience_years: int | None
    education: str | None
    status: str
    created_at: datetime


class CVDetailResponse(BaseModel):
    id: str
    filename: str
    extracted_text: str
    skills: str
    experience_years: int | None
    education: str | None
    status: str
    created_at: datetime


class UpdateCVTextRequest(BaseModel):
    extracted_text: str


class SkillMatch(BaseModel):
    matched: list[str]
    missing: list[str]
    match_count: int
    required_count: int


class ExperienceMatch(BaseModel):
    required: int | None
    candidate: int | None
    matched: bool


class EducationMatch(BaseModel):
    required: str | None
    candidate: str | None
    matched: bool


class MatchResult(BaseModel):
    skills: SkillMatch
    experience: ExperienceMatch
    education: EducationMatch


class ScoreResult(BaseModel):
    skills: float
    experience: float
    education: float
    overall: float


class MatchingResponse(BaseModel):
    job_id: str
    cv_id: str
    match: MatchResult
    score: ScoreResult


class RankedCandidate(BaseModel):
    rank: int
    cv_id: str
    filename: str
    match: MatchResult
    score: ScoreResult


class RankingResponse(BaseModel):
    job_id: str
    candidates: list[RankedCandidate]
