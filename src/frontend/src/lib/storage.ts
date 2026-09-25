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

const DEFAULT_SEED_PROJECTS: EvaluationProject[] = [
	{
		id: "seed-project-ai-intern",
		name: "AI Intern Initial Screening",
		createdAt: "2026-09-25T00:00:00.000Z",
		job: {
			id: "seed-job-ai-intern",
			title: "AI Intern",
			description:
				"We are looking for an AI Intern with Python and machine learning experience.\n\nRequirements:\n\n- Python\n- Machine Learning\n- SQL\n- Git\n- Docker\n- At least 1 year of experience\n- Bachelor's degree in Computer Science or a related field",
			status: "active",
			requirements: {
				skills: ["python", "machine learning", "sql", "git", "docker"],
				experience_years: 1,
				education: "Bachelor's degree in Computer Science or a related field",
			},
		},
		candidates: [
			{
				id: "seed-cv-alex",
				filename: "candidate_001_alex_perera.pdf",
				size: 10240,
			},
			{
				id: "seed-cv-jamie",
				filename: "candidate_002_jamie_silva.pdf",
				size: 10240,
			},
		],
		results: [
			{
				id: "seed-cv-alex",
				filename: "candidate_001_alex_perera.pdf",
				candidateName: "Alex Perera",
				rank: 1,
				fitScore: 92,
				scoreBreakdown: {
					requiredSkills: 100,
					preferredSkills: 80,
					experience: 100,
					semanticSimilarity: 90,
				},
				matches: [
					{
						requirement: "Python",
						category: "skill",
						weight: 1.0,
						status: "strong",
						evidence: "Python developer with SQL, Docker, Git, and machine learning projects.",
					},
				],
				strengths: ["Python", "Machine Learning", "SQL", "Docker"],
				gaps: [],
				explanation: "Strong fit meeting all core requirements.",
			},
			{
				id: "seed-cv-jamie",
				filename: "candidate_002_jamie_silva.pdf",
				candidateName: "Jamie Silva",
				rank: 2,
				fitScore: 68,
				scoreBreakdown: {
					requiredSkills: 60,
					preferredSkills: 50,
					experience: 100,
					semanticSimilarity: 72,
				},
				matches: [
					{
						requirement: "Python",
						category: "skill",
						weight: 1.0,
						status: "strong",
						evidence: "Backend developer with Python, FastAPI, PostgreSQL, SQL, Docker, and Git experience.",
					},
				],
				strengths: ["Python", "SQL", "Docker"],
				gaps: ["Missing machine learning project experience"],
				explanation: "Partial fit lacking specific ML experience.",
			},
		],
	},
];

export function getStoredProjects(): EvaluationProject[] {
	try {
		const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
		if (!raw) return DEFAULT_SEED_PROJECTS;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SEED_PROJECTS;
		return parsed;
	} catch {
		return DEFAULT_SEED_PROJECTS;
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

const BATCHES_STORAGE_KEY = "cv_rank_batches";

export interface CVBatch {
	id: string;
	name: string;
	description?: string;
	cvIds: string[];
	createdAt: string;
}

export function getStoredBatches(): CVBatch[] {
	try {
		const raw = localStorage.getItem(BATCHES_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function sanitizeStoredBatches(validCVIds: string[]): CVBatch[] {
	const current = getStoredBatches();
	const validSet = new Set(validCVIds);
	const sanitized: CVBatch[] = [];

	for (const batch of current) {
		const validBatchCVIds = batch.cvIds.filter((id) => validSet.has(id));
		if (validBatchCVIds.length > 0) {
			sanitized.push({
				...batch,
				cvIds: validBatchCVIds,
			});
		}
	}

	try {
		localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(sanitized));
	} catch {
		// Ignore storage write errors
	}

	return sanitized;
}

export function saveStoredBatch(batch: CVBatch): CVBatch[] {
	const current = getStoredBatches();
	const existingIndex = current.findIndex((b) => b.id === batch.id);
	let updated: CVBatch[];
	if (existingIndex >= 0) {
		updated = [...current];
		updated[existingIndex] = batch;
	} else {
		updated = [batch, ...current];
	}
	localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(updated));
	return updated;
}

export function deleteStoredBatch(batchId: string): CVBatch[] {
	const current = getStoredBatches();
	const filtered = current.filter((b) => b.id !== batchId);
	localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(filtered));
	return filtered;
}
