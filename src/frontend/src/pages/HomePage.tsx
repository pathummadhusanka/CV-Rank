import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router";
import { CandidateEvidenceModal } from "@/components/CandidateEvidenceModal";
import { CandidateLeaderboard } from "@/components/CandidateLeaderboard";
import { CVUploader, type UploadedCandidate } from "@/components/CVUploader";
import { JobCreator } from "@/components/JobCreator";
import { JobRequirementsCard } from "@/components/JobRequirementsCard";
import { Button } from "@/components/ui/button";
import { evaluateCandidatesLive } from "@/lib/rankingEngine";
import {
	getStoredJobs,
	getStoredProjectById,
	saveStoredJob,
	saveStoredProject,
	type EvaluationProject,
} from "@/lib/storage";
import type { CreateJobResponse } from "@/lib/api";
import type { RankedCandidate } from "@/types/ranking";

export default function HomePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [storedJobs, setStoredJobs] = useState<CreateJobResponse[]>(() => getStoredJobs());
	const [activeJob, setActiveJob] = useState<CreateJobResponse | null>(null);
	const [showNewJobForm, setShowNewJobForm] = useState(false);
	const [analysisError, setAnalysisError] = useState<string | null>(null);
	const [candidates, setCandidates] = useState<UploadedCandidate[]>([]);
	const [rankedResults, setRankedResults] = useState<RankedCandidate[]>([]);
	const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
	const [savedProjectName, setSavedProjectName] = useState("");
	const [isProjectSaved, setIsProjectSaved] = useState(false);

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
			const found = storedJobs.find((job) => job.id === jobId);
			if (found) setActiveJob(found);
		} else if (!activeJob && storedJobs.length > 0) {
			setActiveJob(storedJobs[0]);
		}
	}, [searchParams, storedJobs, activeJob]);

	const handleSelectJob = (job: CreateJobResponse) => {
		setActiveJob(job);
		setSearchParams({ jobId: job.id });
		setShowNewJobForm(false);
		setCandidates([]);
		setRankedResults([]);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleJobCreated = (newJob: CreateJobResponse) => {
		setStoredJobs(saveStoredJob(newJob));
		setActiveJob(newJob);
		setSearchParams({ jobId: newJob.id });
		setShowNewJobForm(false);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleRunEvaluation = async () => {
		if (!activeJob || candidates.length === 0) return;

		setIsAnalyzing(true);
		setAnalysisStatus("Sending candidates to the AI service...");
		setAnalysisError(null);
		setIsProjectSaved(false);
		try {
			const results = await evaluateCandidatesLive(activeJob.id, candidates);
			setAnalysisStatus("AI analysis completed.");
			setRankedResults(results);
			setSavedProjectName(`${activeJob.title} - Batch ${new Date().toLocaleDateString()}`);
		} catch (error) {
			setRankedResults([]);
			setAnalysisError(
				error instanceof Error
					? error.message
					: "AI analysis failed. Check the backend and OpenRouter configuration.",
			);
			setAnalysisStatus(null);
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
		setRankedResults([]);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleResetJob = () => {
		setActiveJob(null);
		setSearchParams({});
		setCandidates([]);
		setRankedResults([]);
		setSelectedCandidate(null);
		setAnalysisError(null);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Candidate Evaluation Workspace
					</h1>
					<p className="text-sm text-muted-foreground">
						Select a target role, upload candidate CVs, and generate an AI-assisted ranking.
					</p>
				</div>
				<NavLink to="/jobs">
					<Button variant="outline" size="sm">
						View Jobs Library ({storedJobs.length})
					</Button>
				</NavLink>
			</div>

			{analysisError && (
				<section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-300">
					<strong>Analysis unavailable:</strong> {analysisError}
				</section>
			)}

			<section>
				{!activeJob ? (
					<div className="space-y-4">
						<div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
							<div className="flex items-center justify-between border-b border-border/60 pb-3">
								<h3 className="text-base font-bold text-foreground">Step 1: Choose Target Job Role</h3>
								<Button variant="outline" size="sm" onClick={() => setShowNewJobForm(!showNewJobForm)}>
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
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										{storedJobs.map((job) => (
											<button
												key={job.id}
												type="button"
												onClick={() => handleSelectJob(job)}
												className="cursor-pointer space-y-1.5 rounded-lg border border-border/80 bg-background p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/30"
											>
												<div className="text-sm font-bold text-foreground">{job.title}</div>
												<div className="flex flex-wrap gap-1">
													{job.requirements.skills.slice(0, 4).map((skill) => (
														<span key={skill} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] capitalize text-secondary-foreground">
															{skill}
														</span>
													))}
												</div>
											</button>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				) : (
					<JobRequirementsCard job={activeJob} onReset={handleResetJob} />
				)}
			</section>

			<section>
				<CVUploader onCandidatesChange={handleCandidatesChange} disabled={!activeJob} />
			</section>

			{activeJob && candidates.length > 0 && rankedResults.length === 0 && (
				<section className="flex flex-col justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<span className="size-2 animate-pulse rounded-full bg-emerald-500" />
							<span className="text-xs font-bold uppercase tracking-wider text-foreground">Ready for AI Analysis</span>
						</div>
						<p className="text-xs text-muted-foreground">
							{candidates.length} candidate CV{candidates.length === 1 ? "" : "s"} ready for {activeJob.title}.
						</p>
					</div>
					<Button size="lg" onClick={handleRunEvaluation} disabled={isAnalyzing}>
						{isAnalyzing ? "Analyzing with AI..." : "Run AI Candidate Analysis"}
					</Button>
					{analysisStatus && (
						<p className="text-xs text-muted-foreground" role="status">{analysisStatus}</p>
					)}
				</section>
			)}

			{rankedResults.length > 0 && (
				<section className="space-y-4">
					<div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-foreground">Project Name:</span>
							<input
								type="text"
								value={savedProjectName}
								onChange={(event) => {
									setSavedProjectName(event.target.value);
									setIsProjectSaved(false);
								}}
								placeholder="e.g. Python Backend - Round 1"
								className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
						{isProjectSaved ? (
							<span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">Saved to Projects History</span>
						) : (
							<Button size="sm" onClick={handleSaveProject}>Save Evaluation Project</Button>
						)}
					</div>

					<CandidateLeaderboard
						candidates={rankedResults}
						onSelectCandidate={setSelectedCandidate}
						onRerun={handleRunEvaluation}
						isAnalyzing={isAnalyzing}
					/>
				</section>
			)}

			<CandidateEvidenceModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
		</div>
	);
}
