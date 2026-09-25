import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router";
import { LibrarySearchModal } from "@/components/LibrarySearchModal";
import { CandidateEvidenceModal } from "@/components/CandidateEvidenceModal";
import { CandidateLeaderboard } from "@/components/CandidateLeaderboard";
import type { UploadedCandidate } from "@/components/CVUploader";
import { UploadCVModal } from "@/components/UploadCVModal";
import { JobCreator } from "@/components/JobCreator";
import { JobRequirementsCard } from "@/components/JobRequirementsCard";
import { Button } from "@/components/ui/button";
import { evaluateCandidatesLive } from "@/lib/rankingEngine";
import {
	getStoredBatches,
	getStoredProjectById,
	sanitizeStoredBatches,
	saveStoredProject,
	type CVBatch,
	type EvaluationProject,
} from "@/lib/storage";
import { useSystemStatus } from "@/components/SystemStatusContext";
import { ApiError, getAIRequirements, getCVs, getJobs, type AIHealthStatus, type AIRequirement, type CreateJobResponse, type CVSummary } from "@/lib/api";
import type { RankedCandidate } from "@/types/ranking";

function SearchIcon({ className = "size-3.5" }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
		</svg>
	);
}

export default function HomePage() {
	const { checkHealth, reportAIError } = useSystemStatus();
	const [searchParams, setSearchParams] = useSearchParams();
	const [storedJobs, setStoredJobs] = useState<CreateJobResponse[]>([]);
	const [jobsLoaded, setJobsLoaded] = useState(false);
	const [libraryCVs, setLibraryCVs] = useState<CVSummary[]>([]);
	const [storedBatches, setStoredBatches] = useState<CVBatch[]>(() => getStoredBatches());
	const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
	const [activeJob, setActiveJob] = useState<CreateJobResponse | null>(null);
	const [showNewJobForm, setShowNewJobForm] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [analysisError, setAnalysisError] = useState<string | null>(null);
	const [candidates, setCandidates] = useState<UploadedCandidate[]>([]);
	const [rankedResults, setRankedResults] = useState<RankedCandidate[]>([]);
	const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
	const [savedProjectName, setSavedProjectName] = useState("");
	const [isProjectSaved, setIsProjectSaved] = useState(false);
	const [projectJobAvailable, setProjectJobAvailable] = useState(true);
	const [isChoosingJob, setIsChoosingJob] = useState(false);
	const [reviewedRequirements, setReviewedRequirements] = useState<AIRequirement[] | null>(null);
	const [requirementsLoading, setRequirementsLoading] = useState(false);
	const [requirementsError, setRequirementsError] = useState<string | null>(null);
	const [searchModalMode, setSearchModalMode] = useState<"jobs" | "cvs" | "batches" | "all" | null>(null);

	useEffect(() => {
		getCVs()
			.then((cvs) => {
				setLibraryCVs(cvs);
				setStoredBatches(sanitizeStoredBatches(cvs.map((cv) => cv.id)));
			})
			.catch(() => setLibraryCVs([]));
		getJobs()
			.then((jobs) => {
				setStoredJobs(jobs);
				setJobsLoaded(true);
				setActiveJob((currentJob) =>
					currentJob && jobs.some((job) => job.id === currentJob.id)
						? currentJob
						: null,
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
					const msg = error instanceof Error ? error.message : "Could not extract job requirements.";
					setRequirementsError(msg);
					if (error instanceof ApiError && error.code) {
						reportAIError(error.code as AIHealthStatus, msg);
					}
					checkHealth();
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
		const batchId = searchParams.get("batchId");
		if (batchId && libraryCVs.length > 0) {
			const foundBatch = storedBatches.find((b) => b.id === batchId);
			if (foundBatch) {
				const batchCVIds = foundBatch.cvIds.filter((id) => libraryCVs.some((cv) => cv.id === id));
				setSelectedLibraryIds(batchCVIds);
				const selectedCandidates: UploadedCandidate[] = libraryCVs
					.filter((cv) => batchCVIds.includes(cv.id))
					.map((cv) => ({ id: cv.id, filename: cv.filename, size: 0 }));
				setCandidates(selectedCandidates);
			}
		}

		const projectId = searchParams.get("projectId");
		if (projectId) {
			const project = getStoredProjectById(projectId);
			if (project) {
				setProjectJobAvailable(
					jobsLoaded && storedJobs.some((job) => job.id === project.job.id),
				);
				setActiveJob(project.job);
				setIsChoosingJob(false);
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
			if (found) {
				setActiveJob(found);
				setIsChoosingJob(false);
				setSearchParams({});
			}
		}
	}, [searchParams, storedJobs, activeJob, jobsLoaded, isChoosingJob, libraryCVs, storedBatches]);

	const handleSelectJob = (job: CreateJobResponse) => {
		setActiveJob(job);
		setIsChoosingJob(false);
		setProjectJobAvailable(true);
		setSearchParams({});
		setShowNewJobForm(false);
		setRankedResults([]);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleJobCreated = (newJob: CreateJobResponse) => {
		setStoredJobs((jobs) => [newJob, ...jobs]);
		setActiveJob(newJob);
		setIsChoosingJob(false);
		setProjectJobAvailable(true);
		setSearchParams({});
		setShowNewJobForm(false);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleLibrarySelection = (cvId: string, selected: boolean) => {
		const nextIds = selected
			? [...selectedLibraryIds, cvId]
			: selectedLibraryIds.filter((id) => id !== cvId);
		const selectedCandidates: UploadedCandidate[] = libraryCVs
			.filter((cv) => nextIds.includes(cv.id))
			.map((cv) => ({ id: cv.id, filename: cv.filename, size: 0 }));

		setSelectedLibraryIds(nextIds);
		setCandidates(selectedCandidates);
		setRankedResults([]);
		setAnalysisError(null);
		setIsProjectSaved(false);
	};

	const handleBatchToggle = (batch: CVBatch, selected: boolean) => {
		let nextIds: string[];
		if (selected) {
			nextIds = Array.from(new Set([...selectedLibraryIds, ...batch.cvIds]));
		} else {
			nextIds = selectedLibraryIds.filter((id) => !batch.cvIds.includes(id));
		}
		const selectedCandidates: UploadedCandidate[] = libraryCVs
			.filter((cv) => nextIds.includes(cv.id))
			.map((cv) => ({ id: cv.id, filename: cv.filename, size: 0 }));

		setSelectedLibraryIds(nextIds);
		setCandidates(selectedCandidates);
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
			const msg = error instanceof Error
				? error.message
				: "AI analysis failed. Check the backend and OpenRouter configuration.";
			setAnalysisError(msg);
			setAnalysisStatus(null);
			if (error instanceof ApiError && error.code) {
				reportAIError(error.code as AIHealthStatus, msg);
			}
			checkHealth();
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

	const handleUploadCandidatesChange = async (newUploaded: UploadedCandidate[]) => {
		try {
			const updatedCVs = await getCVs();
			setLibraryCVs(updatedCVs);
			setStoredBatches(sanitizeStoredBatches(updatedCVs.map((cv) => cv.id)));

			const newCVIds = newUploaded.map((u) => u.id);
			const mergedSelectedIds = Array.from(new Set([...selectedLibraryIds, ...newCVIds]));
			setSelectedLibraryIds(mergedSelectedIds);

			const selectedCandidates: UploadedCandidate[] = updatedCVs
				.filter((cv) => mergedSelectedIds.includes(cv.id))
				.map((cv) => ({ id: cv.id, filename: cv.filename, size: 0 }));

			setCandidates(selectedCandidates);
			setRankedResults([]);
			setAnalysisError(null);
			setIsProjectSaved(false);
		} catch {
			// Ignore fetch errors
		}
	};

	const handleResetJob = () => {
		setActiveJob(null);
		setIsChoosingJob(true);
		setProjectJobAvailable(true);
		setSearchParams({});
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
				{!activeJob || isChoosingJob ? (
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
										{storedJobs.slice(0, 3).map((job) => (
											<button
												key={job.id}
												type="button"
												onClick={() => handleSelectJob(job)}
												className="cursor-pointer space-y-1.5 rounded-lg border border-border/80 bg-background p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/30"
											>
												<div className="text-sm font-bold text-foreground">{job.title}</div>
												<p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
											</button>
										))}
										<button
											type="button"
											onClick={() => setSearchModalMode("jobs")}
											className="cursor-pointer space-y-1 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-center transition-all hover:border-primary hover:bg-primary/10 flex flex-col items-center justify-center min-h-[76px]"
										>
											<span className="text-xs font-bold text-primary inline-flex items-center gap-1.5">
												<SearchIcon className="size-3.5" />
												Search and add from library
											</span>
											<span className="text-[11px] text-muted-foreground">Pick from all {storedJobs.length} job roles</span>
										</button>
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

			<section className="space-y-4">
				<div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
						<div>
							<h3 className="text-base font-bold text-foreground">Step 2: Choose From CV Library &amp; Batches</h3>
							<p className="text-xs text-muted-foreground">Select individual CVs or pick entire pre-saved CV Batches for this evaluation.</p>
						</div>
						<div className="flex items-center gap-2">
							<Button size="sm" onClick={() => setShowUploadModal(true)}>
								+ Upload New Resumes
							</Button>
							<NavLink to="/cvs" className="text-xs font-semibold text-primary hover:underline">Manage Library &amp; Batches</NavLink>
						</div>
					</div>

					{/* Saved CV Batches */}
					{storedBatches.length > 0 && (
						<div className="space-y-2">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Pre-saved CV Batches</span>
							<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
								{storedBatches.slice(0, 3).map((batch) => {
									const allInBatchSelected = batch.cvIds.length > 0 && batch.cvIds.every((id) => selectedLibraryIds.includes(id));

									return (
										<label key={batch.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 hover:bg-primary/10 transition-colors">
											<input
												type="checkbox"
												checked={allInBatchSelected}
												onChange={(event) => handleBatchToggle(batch, event.target.checked)}
												className="mt-0.5"
											/>
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<span className="text-xs font-bold text-foreground">{batch.name}</span>
													<span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
														{batch.cvIds.length} CVs
													</span>
												</div>
												{batch.description && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{batch.description}</p>}
											</div>
										</label>
									);
								})}
								<button
									type="button"
									onClick={() => setSearchModalMode("batches")}
									className="cursor-pointer rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-center transition-all hover:border-primary hover:bg-primary/10 flex items-center justify-center gap-1.5 min-h-[48px]"
								>
									<SearchIcon className="size-3.5 text-primary" />
									<span className="text-xs font-bold text-primary">Search and add from library</span>
								</button>
							</div>
						</div>
					)}

					{/* Individual Library CVs */}
					{libraryCVs.length === 0 ? (
						<div className="rounded-lg border border-dashed border-border p-6 text-center space-y-2">
							<p className="text-xs text-muted-foreground">No stored CVs in the system library yet.</p>
							<Button size="sm" variant="outline" onClick={() => setShowUploadModal(true)}>
								+ Upload Resumes to Library
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Individual CV Resumes</span>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								{libraryCVs.slice(0, 3).map((cv) => (
									<label key={cv.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/80 p-3 hover:bg-muted/30">
										<input
											type="checkbox"
											checked={selectedLibraryIds.includes(cv.id)}
											onChange={(event) => handleLibrarySelection(cv.id, event.target.checked)}
										/>
										<span className="min-w-0 truncate text-xs font-medium text-foreground">{cv.filename}</span>
									</label>
								))}
								<button
									type="button"
									onClick={() => setSearchModalMode("cvs")}
									className="cursor-pointer rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-center transition-all hover:border-primary hover:bg-primary/10 flex items-center justify-center gap-1.5 min-h-[44px]"
								>
									<SearchIcon className="size-3.5 text-primary" />
									<span className="text-xs font-bold text-primary">Search and add from library</span>
								</button>
							</div>
						</div>
					)}
				</div>
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

			{showUploadModal && (
				<UploadCVModal
					onCandidatesChange={handleUploadCandidatesChange}
					onClose={() => setShowUploadModal(false)}
				/>
			)}

			{searchModalMode && (
				<LibrarySearchModal
					initialMode={searchModalMode}
					jobs={storedJobs}
					cvs={libraryCVs}
					batches={storedBatches}
					selectedJobId={activeJob?.id}
					selectedCVIds={selectedLibraryIds}
					onSelectJob={handleSelectJob}
					onToggleCV={handleLibrarySelection}
					onToggleBatch={handleBatchToggle}
					onClose={() => setSearchModalMode(null)}
				/>
			)}
		</div>
	);
}
