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
	getStoredProjectById,
	saveStoredProject,
	type EvaluationProject,
} from "@/lib/storage";
import { getAIRequirements, getCVs, getJobs, type AIRequirement, type CreateJobResponse, type CVSummary } from "@/lib/api";
import type { RankedCandidate } from "@/types/ranking";

export default function HomePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [storedJobs, setStoredJobs] = useState<CreateJobResponse[]>([]);
	const [jobsLoaded, setJobsLoaded] = useState(false);
	const [libraryCVs, setLibraryCVs] = useState<CVSummary[]>([]);
	const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
	const [uploadedCandidates, setUploadedCandidates] = useState<UploadedCandidate[]>([]);
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
	const [projectJobAvailable, setProjectJobAvailable] = useState(true);
	const [reviewedRequirements, setReviewedRequirements] = useState<AIRequirement[] | null>(null);
	const [requirementsLoading, setRequirementsLoading] = useState(false);
	const [requirementsError, setRequirementsError] = useState<string | null>(null);

	useEffect(() => {
		getCVs().then(setLibraryCVs).catch(() => setLibraryCVs([]));
		getJobs()
			.then((jobs) => {
				setStoredJobs(jobs);
				setJobsLoaded(true);
				setActiveJob((currentJob) =>
					currentJob && jobs.some((job) => job.id === currentJob.id)
						? currentJob
						: jobs[0] ?? null,
				);
			})
			.catch(() => {
				setStoredJobs([]);
				setJobsLoaded(true);
				setActiveJob(null);
			});
	}, []);

	useEffect(() => {
		if (!activeJob) {
			setReviewedRequirements(null);
			return;
		}
		let mounted = true;
		setRequirementsLoading(true);
		setRequirementsError(null);
		getAIRequirements(activeJob.id)
			.then((requirements) => {
				if (mounted) setReviewedRequirements(requirements);
			})
			.catch((error) => {
				if (mounted) {
					setReviewedRequirements(null);
					setRequirementsError(error instanceof Error ? error.message : "Could not extract job requirements.");
				}
			})
			.finally(() => {
				if (mounted) setRequirementsLoading(false);
			});
		return () => {
			mounted = false;
		};
	}, [activeJob?.id]);

	useEffect(() => {
		const projectId = searchParams.get("projectId");
		if (projectId) {
			const project = getStoredProjectById(projectId);
			if (project) {
				setProjectJobAvailable(
					jobsLoaded && storedJobs.some((job) => job.id === project.job.id),
				);
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
	}, [searchParams, storedJobs, activeJob, jobsLoaded]);

	const handleSelectJob = (job: CreateJobResponse) => {
		setActiveJob(job);
		setProjectJobAvailable(true);
		setSearchParams({ jobId: job.id });
		setShowNewJobForm(false);
		setCandidates([]);
		setUploadedCandidates([]);
		setSelectedLibraryIds([]);
		setRankedResults([]);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleJobCreated = (newJob: CreateJobResponse) => {
		setStoredJobs((jobs) => [newJob, ...jobs]);
		setActiveJob(newJob);
		setProjectJobAvailable(true);
		setSearchParams({ jobId: newJob.id });
		setShowNewJobForm(false);
		setAnalysisError(null);
		setIsProjectSaved(false);
		setCandidates([]);
		setUploadedCandidates([]);
		setSelectedLibraryIds([]);
	};

	const handleLibrarySelection = (cvId: string, selected: boolean) => {
		const nextIds = selected
			? [...selectedLibraryIds, cvId]
			: selectedLibraryIds.filter((id) => id !== cvId);
		const selectedCandidates: UploadedCandidate[] = libraryCVs
			.filter((cv) => nextIds.includes(cv.id))
			.map((cv) => ({ id: cv.id, filename: cv.filename, size: 0 }));

		setSelectedLibraryIds(nextIds);
		setCandidates([...selectedCandidates, ...uploadedCandidates]);
		setRankedResults([]);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleRunEvaluation = async () => {
		if (!activeJob || !projectJobAvailable || candidates.length === 0 || !reviewedRequirements?.length) return;
		if (reviewedRequirements.some((requirement) => !requirement.description.trim())) {
			setRequirementsError("Every requirement needs a description before evaluation.");
			return;
		}

		setIsAnalyzing(true);
		setAnalysisStatus("Sending candidates to the AI service...");
		setAnalysisError(null);
		setIsProjectSaved(false);
		try {
			const results = await evaluateCandidatesLive(activeJob.id, candidates, reviewedRequirements);
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
		setUploadedCandidates(updated);
		const selectedCandidates: UploadedCandidate[] = libraryCVs
			.filter((cv) => selectedLibraryIds.includes(cv.id))
			.map((cv) => ({ id: cv.id, filename: cv.filename, size: 0 }));
		setCandidates([...selectedCandidates, ...updated]);
		setRankedResults([]);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleResetJob = () => {
		setActiveJob(null);
		setProjectJobAvailable(true);
		setSearchParams({});
		setCandidates([]);
		setUploadedCandidates([]);
		setSelectedLibraryIds([]);
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
					<JobRequirementsCard
						job={activeJob}
						onReset={handleResetJob}
						requirements={reviewedRequirements}
						isLoading={requirementsLoading}
						error={requirementsError}
						onRequirementsChange={setReviewedRequirements}
					/>
				)}
			</section>

			<section>
				{activeJob && (
					<div className="mb-4 rounded-xl border border-border bg-card p-6 shadow-xs">
						<div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
							<div>
								<h3 className="text-base font-bold text-foreground">Choose From CV Library</h3>
								<p className="text-xs text-muted-foreground">Reuse previously uploaded CVs for this evaluation.</p>
							</div>
							<NavLink to="/cvs" className="text-xs font-semibold text-primary hover:underline">Open CV Library</NavLink>
						</div>
						{libraryCVs.length === 0 ? (
							<p className="pt-4 text-xs text-muted-foreground">No stored CVs yet. Upload one below.</p>
						) : (
							<div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
								{libraryCVs.map((cv) => (
									<label key={cv.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/80 p-3 hover:bg-muted/30">
										<input
											type="checkbox"
											checked={selectedLibraryIds.includes(cv.id)}
											onChange={(event) => handleLibrarySelection(cv.id, event.target.checked)}
										/>
										<span className="min-w-0 truncate text-xs font-medium text-foreground">{cv.filename}</span>
									</label>
								))}
							</div>
						)}
					</div>
				)}

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
					<Button size="lg" onClick={handleRunEvaluation} disabled={isAnalyzing || requirementsLoading || !reviewedRequirements?.length}>
						{isAnalyzing ? "Analyzing with AI..." : requirementsLoading ? "Preparing Requirements..." : "Run AI Candidate Analysis"}
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
						 canRerun={projectJobAvailable}
					/>
				</section>
			)}

			<CandidateEvidenceModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
		</div>
	);
}
