export interface HealthResponse {
	service: string;
	version: string;
	status: string;
}

export interface JobRequirements {
	skills: string[];
	experience_years: number | null;
	education: string | null;
}

export interface CreateJobPayload {
	title: string;
	description: string;
}

export interface CreateJobResponse {
	id: string;
	title: string;
	status: string;
	requirements: JobRequirements;
}

interface JobSummaryResponse {
	id: string;
	title: string;
	description: string;
	required_skills: string;
	experience_years: number | null;
	education: string | null;
}

export interface UploadCVResponse {
	id: string;
	filename: string;
	status: string;
}

export interface CVSummary {
	id: string;
	filename: string;
	skills: string;
	experience_years: number | null;
	education: string | null;
	status: string;
	created_at: string;
}

export interface AIRequirement {
	description: string;
	category: string;
	required: boolean;
	weight: number;
}

export type AIAssessmentClassification =
	| "strong_match"
	| "partial_match"
	| "no_evidence"
	| "contradictory_evidence";

export interface AIRequirementMatch {
	requirement: AIRequirement;
	classification: AIAssessmentClassification;
	evidence: string[];
	semantic_similarity: number;
	match_value: number;
}

export interface AIAnalysisCandidate {
	rank: number;
	cv_id: string;
	filename: string;
	required_skill_score: number;
	preferred_skill_score: number;
	experience_score: number;
	semantic_similarity_score: number;
	overall_score: number;
	matches: AIRequirementMatch[];
	strengths: string[];
	gaps: string[];
	explanation: string;
}

export interface AIAnalysisResponse {
	requirements: AIRequirement[];
	candidates: AIAnalysisCandidate[];
}

export class ApiError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		let message = `Request failed with status ${res.status}`;
		try {
			const data = await res.json();
			if (data && typeof data.detail === "string") {
				message = data.detail;
			}
		} catch {
			// ignore json parse error, keep default status message
		}
		throw new ApiError(res.status, message);
	}
	if (res.status === 204) {
		return undefined as T;
	}
	return res.json() as Promise<T>;
}

export async function getHealth(): Promise<HealthResponse> {
	const res = await fetch("/api/health");
	return handleResponse<HealthResponse>(res);
}

export async function createJob(payload: CreateJobPayload): Promise<CreateJobResponse> {
	const res = await fetch("/api/jobs", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});
	return handleResponse<CreateJobResponse>(res);
}

export async function getJobs(): Promise<CreateJobResponse[]> {
	const res = await fetch("/api/jobs");
	const jobs = await handleResponse<JobSummaryResponse[]>(res);
	return jobs.map((job) => ({
		id: job.id,
		title: job.title,
		status: "stored",
		requirements: {
			skills: job.required_skills
				.split(",")
				.map((skill) => skill.trim())
				.filter(Boolean),
			experience_years: job.experience_years,
			education: job.education,
		},
	}));
}

export async function deleteJob(jobId: string): Promise<void> {
	const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
	await handleResponse<void>(res);
}

export interface SkillMatchResult {
	matched: string[];
	missing: string[];
	match_count: number;
	required_count: number;
}

export interface ExperienceMatchResult {
	required: number | null;
	candidate: number | null;
	matched: boolean;
}

export interface EducationMatchResult {
	required: string | null;
	candidate: string | null;
	matched: boolean;
}

export interface CandidateMatchDetails {
	skills: SkillMatchResult;
	experience: ExperienceMatchResult;
	education: EducationMatchResult;
}

export interface CandidateMatchScores {
	skills: number;
	experience: number;
	education: number;
	overall: number;
}

export interface MatchCVResponse {
	job_id: string;
	cv_id: string;
	match: CandidateMatchDetails;
	score: CandidateMatchScores;
}

export async function uploadCV(file: File): Promise<UploadCVResponse> {
	const formData = new FormData();
	formData.append("file", file);

	const res = await fetch("/api/cvs", {
		method: "POST",
		body: formData,
	});
	return handleResponse<UploadCVResponse>(res);
}

export async function getCVs(): Promise<CVSummary[]> {
	const res = await fetch("/api/cvs");
	return handleResponse<CVSummary[]>(res);
}

export async function deleteCV(cvId: string): Promise<void> {
	const res = await fetch(`/api/cvs/${cvId}`, { method: "DELETE" });
	await handleResponse<void>(res);
}

export async function matchCVToJob(jobId: string, cvId: string): Promise<MatchCVResponse> {
	const res = await fetch(`/api/matching/jobs/${jobId}/cvs/${cvId}`, {
		method: "POST",
	});
	return handleResponse<MatchCVResponse>(res);
}

export async function analyzeJob(jobId: string, cvIds: string[]): Promise<AIAnalysisResponse> {
	console.info(`[analysis] request started job=${jobId}`);
	const res = await fetch(`/api/analysis/jobs/${jobId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ cv_ids: cvIds }),
	});
	console.info(`[analysis] response received status=${res.status}`);
	return handleResponse<AIAnalysisResponse>(res);
}

