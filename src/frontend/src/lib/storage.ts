import type { CreateJobResponse } from "@/lib/api";
import type { UploadedCandidate } from "@/components/CVUploader";
import type { RankedCandidate } from "@/types/ranking";

const JOBS_STORAGE_KEY = "cv_rank_jobs";
const PROJECTS_STORAGE_KEY = "cv_rank_projects";
const LEGACY_SAMPLE_JOB_ID = "sample-job-python-dev";

export interface EvaluationProject {
	id: string;
	name: string;
	createdAt: string;
	job: CreateJobResponse;
	candidates: UploadedCandidate[];
	results: RankedCandidate[];
}

export function getStoredJobs(): CreateJobResponse[] {
	try {
		const raw = localStorage.getItem(JOBS_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((job) => job?.id !== LEGACY_SAMPLE_JOB_ID)
			: [];
	} catch {
		return [];
	}
}

export function saveStoredJob(job: CreateJobResponse): CreateJobResponse[] {
	const current = getStoredJobs();
	// Check if already exists, update or prepend
	const existingIndex = current.findIndex((j) => j.id === job.id);
	let updated: CreateJobResponse[];
	if (existingIndex >= 0) {
		updated = [...current];
		updated[existingIndex] = job;
	} else {
		updated = [job, ...current];
	}
	localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
	return updated;
}

export function deleteStoredJob(jobId: string): CreateJobResponse[] {
	const current = getStoredJobs();
	const filtered = current.filter((j) => j.id !== jobId);
	localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(filtered));
	return filtered;
}

export function getStoredProjects(): EvaluationProject[] {
	try {
		const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function saveStoredProject(project: EvaluationProject): EvaluationProject[] {
	const current = getStoredProjects();
	const existingIndex = current.findIndex((p) => p.id === project.id);
	let updated: EvaluationProject[];
	if (existingIndex >= 0) {
		updated = [...current];
		updated[existingIndex] = project;
	} else {
		updated = [project, ...current];
	}
	localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
	return updated;
}

export function deleteStoredProject(projectId: string): EvaluationProject[] {
	const current = getStoredProjects();
	const filtered = current.filter((p) => p.id !== projectId);
	localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));
	return filtered;
}

export function getStoredProjectById(projectId: string): EvaluationProject | null {
	const projects = getStoredProjects();
	return projects.find((p) => p.id === projectId) ?? null;
}

