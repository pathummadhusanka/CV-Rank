import type { CreateJobResponse } from "@/lib/api";
import type { UploadedCandidate } from "@/components/CVUploader";
import type { RankedCandidate } from "@/types/ranking";

const PROJECTS_STORAGE_KEY = "cv_rank_projects";

export interface EvaluationProject {
	id: string;
	name: string;
	createdAt: string;
	job: CreateJobResponse;
	candidates: UploadedCandidate[];
	results: RankedCandidate[];
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

