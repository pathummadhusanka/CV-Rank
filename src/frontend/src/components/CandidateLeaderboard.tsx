import type { RankedCandidate } from "@/types/ranking";
import { Button } from "@/components/ui/button";

interface CandidateLeaderboardProps {
	candidates: RankedCandidate[];
	onSelectCandidate: (candidate: RankedCandidate) => void;
	onRerun: () => void;
	isAnalyzing?: boolean;
}

export function CandidateLeaderboard({
	candidates,
	onSelectCandidate,
	onRerun,
	isAnalyzing = false,
}: CandidateLeaderboardProps) {
	const exportToCSV = () => {
		const headers = ["Rank", "Candidate", "Filename", "Fit Score (%)", "Strengths", "Gaps"];
		const rows = candidates.map((c) => [
			c.rank,
			`"${c.candidateName || c.filename}"`,
			`"${c.filename}"`,
			c.fitScore,
			`"${c.strengths.join("; ")}"`,
			`"${c.gaps.join("; ")}"`,
		]);

		const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `cv-rank-results-${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const getRankBadgeClass = (rank: number) => {
		if (rank === 1) return "bg-amber-400 text-amber-950 font-black shadow-xs ring-2 ring-amber-400/20";
		if (rank === 2) return "bg-slate-300 text-slate-900 font-bold shadow-xs";
		if (rank === 3) return "bg-amber-700/80 text-amber-50 font-bold shadow-xs";
		return "bg-muted text-muted-foreground font-semibold";
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
		if (score >= 60) return "text-amber-600 dark:text-amber-400";
		return "text-rose-600 dark:text-rose-400";
	};

	return (
		<div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
				<div>
					<div className="flex items-center gap-2">
						<h3 className="text-base font-bold text-foreground tracking-tight">
							Step 3: Candidate Leaderboard &amp; Rankings
						</h3>
						<span className="inline-flex items-center rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-semibold">
							{candidates.length} Evaluated
						</span>
					</div>
					<p className="text-xs text-muted-foreground mt-0.5">
						Deterministic scoring (0–100) based on weighted job criteria matches and CV evidence.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={exportToCSV}
						disabled={isAnalyzing || candidates.length === 0}
					>
						Export CSV
					</Button>
					<Button
						variant="default"
						size="sm"
						onClick={onRerun}
						disabled={isAnalyzing}
					>
						{isAnalyzing ? "Recalculating..." : "Rerun Evaluation"}
					</Button>
				</div>
			</div>

			{/* Candidates List */}
			<div className="divide-y divide-border/60 rounded-lg border border-border overflow-hidden bg-background">
				{candidates.map((candidate) => {
					const strongCount = candidate.matches.filter((m) => m.status === "strong").length;
					const partialCount = candidate.matches.filter((m) => m.status === "partial").length;
					const missingCount = candidate.matches.filter((m) => m.status === "no_evidence" || m.status === "contradictory").length;

					return (
						<div
							key={candidate.id}
							className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-muted/30 transition-colors"
						>
							<div className="flex items-center gap-3.5 min-w-0">
								<div
									className={`size-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${getRankBadgeClass(
										candidate.rank,
									)}`}
								>
									#{candidate.rank}
								</div>

								<div className="min-w-0">
									<h4 className="text-sm font-bold text-foreground truncate">
										{candidate.candidateName || candidate.filename}
									</h4>
									<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
										<span className="font-mono text-[11px] truncate max-w-xs">{candidate.filename}</span>
										<span>&bull;</span>
										<div className="flex items-center gap-1.5">
											<span className="text-emerald-600 dark:text-emerald-400 font-medium">
												{strongCount} Strong
											</span>
											<span>&bull;</span>
											<span className="text-amber-600 dark:text-amber-400 font-medium">
												{partialCount} Partial
											</span>
											<span>&bull;</span>
											<span className="text-muted-foreground">
												{missingCount} Missing
											</span>
										</div>
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
								{/* Score metric */}
								<div className="flex items-center gap-3 min-w-[120px]">
									<div className="flex-1 bg-muted rounded-full h-2 w-20 overflow-hidden">
										<div
											className={`h-full rounded-full transition-all duration-500 ${
												candidate.fitScore >= 80
													? "bg-emerald-500"
													: candidate.fitScore >= 60
														? "bg-amber-500"
														: "bg-rose-500"
											}`}
											style={{ width: `${candidate.fitScore}%` }}
										/>
									</div>
									<span className={`text-base font-black tracking-tight ${getScoreColor(candidate.fitScore)}`}>
										{candidate.fitScore}%
									</span>
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={() => onSelectCandidate(candidate)}
								>
									View Evidence
								</Button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
