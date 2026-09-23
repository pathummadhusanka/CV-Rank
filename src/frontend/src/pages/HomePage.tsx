import { useState } from "react";
import { JobCreator } from "@/components/JobCreator";
import { JobRequirementsCard } from "@/components/JobRequirementsCard";
import { CVUploader, type UploadedCandidate } from "@/components/CVUploader";
import type { CreateJobResponse } from "@/lib/api";

export default function HomePage() {
	const [activeJob, setActiveJob] = useState<CreateJobResponse | null>(null);
	const [candidates, setCandidates] = useState<UploadedCandidate[]>([]);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Candidate Evaluation Workspace
				</h1>
				<p className="text-sm text-muted-foreground">
					Define your job requirements and compare candidate CVs with automated scoring and evidence.
				</p>
			</div>

			{/* Step 1: Job Requirements */}
			<section>
				{!activeJob ? (
					<JobCreator onJobCreated={setActiveJob} />
				) : (
					<JobRequirementsCard
						job={activeJob}
						onReset={() => {
							setActiveJob(null);
							setCandidates([]);
						}}
					/>
				)}
			</section>

			{/* Step 2: Upload Candidate CVs */}
			<section>
				<CVUploader
					onCandidatesChange={setCandidates}
					disabled={!activeJob}
				/>
			</section>

			{/* Step 3 Preview: Staging & Ranking Status */}
			{activeJob && candidates.length > 0 && (
				<section className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<span className="text-xs font-bold text-foreground uppercase tracking-wider">
								Ready for Ranking
							</span>
						</div>
						<p className="text-xs text-muted-foreground">
							{candidates.length} candidate CV{candidates.length === 1 ? "" : "s"} processed for &ldquo;{activeJob.title}&rdquo;.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground border border-border">
							{candidates.length} Staged Candidate{candidates.length === 1 ? "" : "s"}
						</span>
					</div>
				</section>
			)}
		</div>
	);
}


