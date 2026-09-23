import { useState } from "react";
import { JobCreator } from "@/components/JobCreator";
import { JobRequirementsCard } from "@/components/JobRequirementsCard";
import type { CreateJobResponse } from "@/lib/api";

export default function HomePage() {
	const [activeJob, setActiveJob] = useState<CreateJobResponse | null>(null);

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
						onReset={() => setActiveJob(null)}
					/>
				)}
			</section>

			{/* Step 2 Preview: CV Upload (To be connected in Step 4) */}
			<section className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
				<div className="max-w-md mx-auto space-y-2">
					<div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground font-semibold text-sm">
						2
					</div>
					<h3 className="text-sm font-semibold text-foreground">
						Step 2: Upload Candidate CVs
					</h3>
					<p className="text-xs text-muted-foreground">
						{activeJob
							? `Upload candidate PDF CVs to match against "${activeJob.title}".`
							: "Define a job description above to start uploading and evaluating candidate CVs."}
					</p>
				</div>
			</section>
		</div>
	);
}

