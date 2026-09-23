import { useState, useEffect } from "react";
import { useSearchParams, NavLink } from "react-router";
import { JobCreator } from "@/components/JobCreator";
import { JobRequirementsCard } from "@/components/JobRequirementsCard";
import { CVUploader, type UploadedCandidate } from "@/components/CVUploader";
import { CandidateLeaderboard } from "@/components/CandidateLeaderboard";
import { CandidateEvidenceModal } from "@/components/CandidateEvidenceModal";
import { evaluateCandidatesLive } from "@/lib/rankingEngine";
import {
	getStoredJobs,
	saveStoredJob,
	saveStoredProject,
	getStoredProjectById,
	type EvaluationProject,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import type { CreateJobResponse } from "@/lib/api";
import type { RankedCandidate } from "@/types/ranking";

export default function HomePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [storedJobs, setStoredJobs] = useState<CreateJobResponse[]>(() => getStoredJobs());
	const [activeJob, setActiveJob] = useState<CreateJobResponse | null>(null);
	const [showNewJobForm, setShowNewJobForm] = useState(false);
	const [candidates, setCandidates] = useState<UploadedCandidate[]>([]);
	const [rankedResults, setRankedResults] = useState<RankedCandidate[]>([]);
	const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [savedProjectName, setSavedProjectName] = useState("");
	const [isProjectSaved, setIsProjectSaved] = useState(false);

	// Load job or saved project from query parameter if present
	useEffect(() => {
		const projectId = searchParams.get("projectId");
		if (projectId) {
			const project = getStoredProjectById(projectId);
			if (project) {
				setActiveJob(project.job);
				setCandidates(project.candidates);
				setRankedResults(project.results);
				setSavedProjectName(project.name);
				setIsProjectSaved(true);
				return;
			}
		}

		const jobId = searchParams.get("jobId");
		if (jobId) {
			const found = storedJobs.find((j) => j.id === jobId);
			if (found) {
				setActiveJob(found);
			}
		} else if (!activeJob && storedJobs.length > 0) {
			// Pre-select first position by default
			setActiveJob(storedJobs[0]);
		}
	}, [searchParams, storedJobs]);

	const handleSelectJob = (job: CreateJobResponse) => {
		setActiveJob(job);
		setSearchParams({ jobId: job.id });
		setShowNewJobForm(false);
		setCandidates([]);
		setRankedResults([]);
		setIsProjectSaved(false);
	};

	const handleJobCreated = (newJob: CreateJobResponse) => {
		const updated = saveStoredJob(newJob);
		setStoredJobs(updated);
		setActiveJob(newJob);
		setSearchParams({ jobId: newJob.id });
		setShowNewJobForm(false);
		setIsProjectSaved(false);
	};

	const handleRunEvaluation = async () => {
		if (!activeJob || candidates.length === 0) return;
		setIsAnalyzing(true);
		setIsProjectSaved(false);
		try {
			const results = await evaluateCandidatesLive(activeJob, candidates);
			setRankedResults(results);
			setSavedProjectName(`${activeJob.title} - Batch ${new Date().toLocaleDateString()}`);
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleSaveProject = () => {
		if (!activeJob || rankedResults.length === 0) return;
		const name = savedProjectName.trim() || `${activeJob.title} - Run`;
		const newProject: EvaluationProject = {
			id: `proj-${Date.now()}`,
			name,
			createdAt: new Date().toISOString(),
			job: activeJob,
			candidates,
			results: rankedResults,
		};
		saveStoredProject(newProject);
		setIsProjectSaved(true);
		setSearchParams({ projectId: newProject.id });
	};

	const handleCandidatesChange = (updated: UploadedCandidate[]) => {
		setCandidates(updated);
		// Reset ranking if candidate list changes
		setRankedResults([]);
	};

	const handleResetJob = () => {
		setActiveJob(null);
		setSearchParams({});
		setCandidates([]);
		setRankedResults([]);
		setSelectedCandidate(null);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Candidate Evaluation Workspace
					</h1>
					<p className="text-sm text-muted-foreground">
						Select a target role, ingest candidate CVs, and generate deterministic rankings.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<NavLink to="/jobs">
						<Button variant="outline" size="sm">
							View Jobs Library ({storedJobs.length})
						</Button>
					</NavLink>
				</div>
			</div>

			{/* Step 1: Position Selection or Creation */}
			<section>
				{!activeJob ? (
					<div className="space-y-4">
						<div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
							<div className="flex items-center justify-between border-b border-border/60 pb-3">
								<h3 className="text-base font-bold text-foreground">
									Step 1: Choose Target Job Role
								</h3>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowNewJobForm(!showNewJobForm)}
								>
									{showNewJobForm ? "Pick From Library" : "+ Define New Job"}
								</Button>
							</div>

							{showNewJobForm ? (
								<JobCreator onJobCreated={handleJobCreated} />
							) : (
								<div className="space-y-3">
									<p className="text-xs text-muted-foreground">
										Select a position from your jobs library to evaluate candidate resumes against:
									</p>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{storedJobs.map((job) => (
											<button
												key={job.id}
												type="button"
												onClick={() => handleSelectJob(job)}
												className="p-4 rounded-lg border border-border/80 bg-background text-left hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer space-y-1.5"
											>
												<div className="font-bold text-sm text-foreground">
													{job.title}
												</div>
												<div className="flex flex-wrap gap-1">
													{job.requirements.skills.slice(0, 4).map((s) => (
														<span
															key={s}
															className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded capitalize"
														>
															{s}
														</span>
													))}
													{job.requirements.skills.length > 4 && (
														<span className="text-[10px] text-muted-foreground self-center">
															+{job.requirements.skills.length - 4} more
														</span>
													)}
												</div>
											</button>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="space-y-3">
						<JobRequirementsCard
							job={activeJob}
							onReset={handleResetJob}
						/>
					</div>
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
				<section className="space-y-4">
					{/* Project Save Bar */}
					<div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
						<div className="flex items-center gap-3 flex-1 min-w-0">
							<span className="text-xs font-semibold text-foreground uppercase tracking-wider shrink-0">
								Project Name:
							</span>
							<input
								type="text"
								value={savedProjectName}
								onChange={(e) => {
									setSavedProjectName(e.target.value);
									setIsProjectSaved(false);
								}}
								placeholder="e.g. Python Backend - Round 1"
								className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							{isProjectSaved ? (
								<span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
									✓ Saved to Projects History
								</span>
							) : (
								<Button size="sm" onClick={handleSaveProject}>
									Save Evaluation Project
								</Button>
							)}
						</div>
					</div>

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



