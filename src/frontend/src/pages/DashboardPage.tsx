import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
	getStoredProjects,
	deleteStoredProject,
	type EvaluationProject,
} from "@/lib/storage";
import { getJobs } from "@/lib/api";

export default function DashboardPage() {
	const navigate = useNavigate();
	const [jobs, setJobs] = useState(0);
	const [projects, setProjects] = useState<EvaluationProject[]>(() => getStoredProjects());

	useEffect(() => {
		getJobs().then((loadedJobs) => setJobs(loadedJobs.length)).catch(() => setJobs(0));
	}, []);

	const handleDeleteProject = (projectId: string) => {
		const updated = deleteStoredProject(projectId);
		setProjects(updated);
	};

	const handleOpenProject = (projectId: string) => {
		navigate(`/?projectId=${projectId}`);
	};

	// Calculate high-level metrics
	const totalCandidatesEvaluated = projects.reduce(
		(sum, p) => sum + (p.candidates?.length ?? p.results?.length ?? 0),
		0,
	);

	const allScores = projects.flatMap((p) => p.results.map((r) => r.fitScore));
	const topScore = allScores.length > 0 ? Math.max(...allScores) : null;
	const avgScore =
		allScores.length > 0
			? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
			: null;

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Recruitment Analytics &amp; Projects
					</h1>
					<p className="text-sm text-muted-foreground">
						Overview of configured positions and historical evaluation batches.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<NavLink to="/">
						<Button size="sm">+ New Evaluation</Button>
					</NavLink>
				</div>
			</div>

			{/* Metric Cards Grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-1">
					<span className="text-xs text-muted-foreground uppercase font-semibold">
						Job Positions
					</span>
					<div className="text-2xl font-black text-foreground">{jobs}</div>
					<p className="text-[11px] text-muted-foreground">Available criteria targets</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-1">
					<span className="text-xs text-muted-foreground uppercase font-semibold">
						Evaluation Projects
					</span>
					<div className="text-2xl font-black text-foreground">{projects.length}</div>
					<p className="text-[11px] text-muted-foreground">Saved ranking sessions</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-1">
					<span className="text-xs text-muted-foreground uppercase font-semibold">
						Candidates Screened
					</span>
					<div className="text-2xl font-black text-foreground">
						{totalCandidatesEvaluated}
					</div>
					<p className="text-[11px] text-muted-foreground">Resumes processed</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-1">
					<span className="text-xs text-muted-foreground uppercase font-semibold">
						Top Fit Score
					</span>
					<div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
						{topScore !== null ? `${topScore}%` : "—"}
					</div>
					<p className="text-[11px] text-muted-foreground">
						{avgScore !== null ? `Avg score: ${avgScore}%` : "No runs yet"}
					</p>
				</div>
			</div>

			{/* Saved Projects Section */}
			<div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-border/60">
					<div className="space-y-0.5">
						<h3 className="text-base font-bold text-foreground">
							Saved Evaluation Projects
						</h3>
						<p className="text-xs text-muted-foreground">
							Historical ranking runs, candidate score snapshots, and evidence breakdowns.
						</p>
					</div>

					<span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
						{projects.length} Saved
					</span>
				</div>

				{projects.length === 0 ? (
					<div className="py-12 text-center space-y-3">
						<div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground font-bold">
							📂
						</div>
						<div className="space-y-1">
							<h4 className="text-sm font-semibold text-foreground">
								No saved projects yet
							</h4>
							<p className="text-xs text-muted-foreground max-w-sm mx-auto">
								Start an evaluation in the Workspace, upload candidate CVs, and save your run to view history here.
							</p>
						</div>
						<NavLink to="/">
							<Button size="sm">Go to Evaluation Workspace</Button>
						</NavLink>
					</div>
				) : (
					<div className="divide-y divide-border/60 rounded-lg border border-border overflow-hidden bg-background">
						{projects.map((proj) => {
							const topCandidate = proj.results[0];
							const dateFormatted = new Date(proj.createdAt).toLocaleDateString(undefined, {
								month: "short",
								day: "numeric",
								year: "numeric",
							});

							return (
								<div
									key={proj.id}
									className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/30 transition-colors"
								>
									<div className="space-y-1 min-w-0">
										<div className="flex items-center gap-2">
											<h4 className="text-sm font-bold text-foreground truncate">
												{proj.name}
											</h4>
											<span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
												{dateFormatted}
											</span>
										</div>

										<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
											<span className="font-medium text-foreground">
												Role: {proj.job.title}
											</span>
											<span>&bull;</span>
											<span>
												{proj.results.length} candidate{proj.results.length === 1 ? "" : "s"}
											</span>
											{topCandidate && (
												<>
													<span>&bull;</span>
													<span className="text-emerald-600 dark:text-emerald-400 font-medium">
														Top: {topCandidate.candidateName || topCandidate.filename} ({topCandidate.fitScore}%)
													</span>
												</>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleOpenProject(proj.id)}
										>
											Open Project &rarr;
										</Button>
										<button
											type="button"
											onClick={() => handleDeleteProject(proj.id)}
											className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted cursor-pointer transition-colors"
											title="Delete project"
										>
											&times;
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
