import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createJob, type CreateJobResponse } from "@/lib/api";

interface JobCreatorProps {
	onJobCreated: (job: CreateJobResponse) => void;
	disabled?: boolean;
}

const SAMPLE_JOB = {
	title: "Senior Python Backend Developer",
	description:
		"We are looking for a Senior Python Backend Developer with 3+ years of experience building high-performance web APIs using FastAPI and Django. The ideal candidate has deep expertise in SQL, PostgreSQL, Docker, Git, and cloud services like AWS. A bachelor's degree in Computer Science or a related engineering field is preferred.",
};

export function JobCreator({ onJobCreated, disabled }: JobCreatorProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLoadSample = () => {
		setTitle(SAMPLE_JOB.title);
		setDescription(SAMPLE_JOB.description);
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) {
			setError("Please enter a job title.");
			return;
		}
		if (!description.trim()) {
			setError("Please enter a job description.");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const res = await createJob({
				title: title.trim(),
				description: description.trim(),
			});
			onJobCreated(res);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to create job and parse requirements. Ensure backend is running.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="rounded-xl border border-border bg-card p-6 shadow-xs">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-border/60">
				<div>
					<h3 className="text-base font-bold text-foreground tracking-tight">
						Step 1: Define Job Description
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Enter the position details. Requirements will be extracted for this specific role and reviewed before evaluation.
					</p>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleLoadSample}
					disabled={isSubmitting || disabled}
				>
					Load Sample Job
				</Button>
			</div>

			{error && (
				<div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center justify-between">
					<span>{error}</span>
					<button
						type="button"
						onClick={() => setError(null)}
						className="font-bold hover:opacity-75 ml-2 cursor-pointer"
					>
						&times;
					</button>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1.5">
					<label
						htmlFor="job-title"
						className="block text-xs font-semibold text-foreground"
					>
						Job Title
					</label>
					<input
						id="job-title"
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="e.g. Senior Python Engineer"
						disabled={isSubmitting || disabled}
						className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
					/>
				</div>

				<div className="space-y-1.5">
					<label
						htmlFor="job-description"
						className="block text-xs font-semibold text-foreground"
					>
						Job Description
					</label>
					<textarea
						id="job-description"
						rows={5}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Paste the full job description or requirements here..."
						disabled={isSubmitting || disabled}
						className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-y"
					/>
				</div>

				<div className="flex items-center justify-end gap-3 pt-2">
					<Button
						type="submit"
						size="lg"
						disabled={isSubmitting || disabled}
					>
						{isSubmitting ? "Creating Job..." : "Create & Review Requirements"}
					</Button>
				</div>
			</form>
		</div>
	);
}
