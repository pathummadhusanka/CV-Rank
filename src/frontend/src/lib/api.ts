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

export interface UploadCVResponse {
	id: string;
	filename: string;
	status: string;
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

export async function uploadCV(file: File): Promise<UploadCVResponse> {
	const formData = new FormData();
	formData.append("file", file);

	const res = await fetch("/api/cvs", {
		method: "POST",
		body: formData,
	});
	return handleResponse<UploadCVResponse>(res);
}
