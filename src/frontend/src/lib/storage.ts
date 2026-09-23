import type { CreateJobResponse } from "@/lib/api";

const JOBS_STORAGE_KEY = "cv_rank_jobs";

export const DEFAULT_SAMPLE_JOB: CreateJobResponse = {
	id: "sample-job-python-dev",
	title: "Senior Python Backend Developer",
	status: "created",
	requirements: {
		skills: ["python", "fastapi", "django", "sql", "postgresql", "docker", "git", "aws"],
		experience_years: 3,
		education: "bachelor's degree",
	},
};

export function getStoredJobs(): CreateJobResponse[] {
	try {
		const raw = localStorage.getItem(JOBS_STORAGE_KEY);
		if (!raw) {
			// Initialize with default sample position for easy testing
			localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify([DEFAULT_SAMPLE_JOB]));
			return [DEFAULT_SAMPLE_JOB];
		}
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_SAMPLE_JOB];
	} catch {
		return [DEFAULT_SAMPLE_JOB];
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
