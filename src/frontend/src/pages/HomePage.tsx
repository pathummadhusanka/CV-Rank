import { useState } from "react";
import { JobCreator } from "@/components/JobCreator";
import { JobRequirementsCard } from "@/components/JobRequirementsCard";
import { CVUploader, type UploadedCandidate } from "@/components/CVUploader";
import { CandidateLeaderboard } from "@/components/CandidateLeaderboard";
import { CandidateEvidenceModal } from "@/components/CandidateEvidenceModal";
import { evaluateCandidates } from "@/lib/rankingEngine";
import { Button } from "@/components/ui/button";
import type { CreateJobResponse } from "@/lib/api";
import type { RankedCandidate } from "@/types/ranking";

export default function HomePage() {
	const [activeJob, setActiveJob] = useState<CreateJobResponse | null>(null);
	const [candidates, setCandidates] = useState<UploadedCandidate[]>([]);
	const [rankedResults, setRankedResults] = useState<RankedCandidate[]>([]);
	const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	const handleRunEvaluation = () => {
		if (!activeJob || candidates.length === 0) return;
		setIsAnalyzing(true);
		// Simulate brief analysis calculation delay
		setTimeout(() => {
			const results = evaluateCandidates(activeJob, candidates);
			setRankedResults(results);
			setIsAnalyzing(false);
		}, 600);
	};

	const handleCandidatesChange = (updated: UploadedCandidate[]) => {
		setCandidates(updated);
		// Reset ranking if candidate list changes
		setRankedResults([]);
	};

	const handleResetJob = () => {
		setActiveJob(null);
		setCandidates([]);
		setRankedResults([]);
		setSelectedCandidate(null);
	};

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
						onReset={handleResetJob}
					/>
				)}
			</section>

			{/* Step 2: Upload Candidate CVs */}
			<section>
				<CVUploader
					onCandidatesChange={handleCandidatesChange}
					disabled={!activeJob}
				/>
			</section>

			{/* Step 3: Run Evaluation Trigger (when candidates uploaded but not evaluated yet) */}
			{activeJob && candidates.length > 0 && rankedResults.length === 0 && (
				<section className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<span className="text-xs font-bold text-foreground uppercase tracking-wider">
								Ready for Ranking
							</span>
						</div>
						<p className="text-xs text-muted-foreground">
							{candidates.length} candidate CV{candidates.length === 1 ? "" : "s"} ready to match against &ldquo;{activeJob.title}&rdquo;.
						</p>
					</div>

					<Button
						size="lg"
						onClick={handleRunEvaluation}
						disabled={isAnalyzing}
					>
						{isAnalyzing ? "Computing Fit Scores..." : "Run Candidate Ranking"}
					</Button>
				</section>
			)}

			{/* Step 3: Leaderboard (when evaluation has been computed) */}
			{rankedResults.length > 0 && (
				<section>
					<CandidateLeaderboard
						candidates={rankedResults}
						onSelectCandidate={setSelectedCandidate}
						onRerun={handleRunEvaluation}
						isAnalyzing={isAnalyzing}
					/>
				</section>
			)}

			{/* Candidate Evidence Modal */}
			<CandidateEvidenceModal
				candidate={selectedCandidate}
				onClose={() => setSelectedCandidate(null)}
			/>
		</div>
	);
}



