import { useEffect } from "react";
import type { RankedCandidate } from "@/types/ranking";
import { Button } from "@/components/ui/button";

interface CandidateEvidenceModalProps {
	candidate: RankedCandidate | null;
	onClose: () => void;
}

export function CandidateEvidenceModal({ candidate, onClose }: CandidateEvidenceModalProps) {
	useEffect(() => {
		if (!candidate) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [candidate, onClose]);

	if (!candidate) return null;

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
		if (score >= 60) return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
		return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
	};

	const getBadgeForStatus = (status: RankedCandidate["matches"][number]["status"]) => {
		switch (status) {
			case "strong":
				return (
					<span className="inline-flex items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold">
						Match Found
					</span>
				);
			case "partial":
				return (
					<span className="inline-flex items-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[11px] font-semibold">
						Partial
					</span>
				);
			case "contradictory":
				return (
					<span className="inline-flex items-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 text-[11px] font-semibold">
						Conflict
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center rounded-md bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[11px] font-medium">
						Missing Evidence
					</span>
				);
		}
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
			<button
				type="button"
				className="fixed inset-0 cursor-default"
				onClick={onClose}
				aria-label="Close evidence breakdown"
			/>

			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="candidate-evidence-title"
				className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
			>
				{/* Modal Header */}
				<div className="p-6 border-b border-border/80 flex items-start justify-between gap-4 bg-muted/20">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<span className="inline-flex items-center rounded-md bg-primary text-primary-foreground font-bold px-2 py-0.5 text-xs">
								Rank #{candidate.rank}
							</span>
							<span className="text-xs text-muted-foreground font-mono">
								ID: {candidate.id.slice(0, 8)}...
							</span>
						</div>
						<h2 id="candidate-evidence-title" className="text-lg font-bold text-foreground">
							{candidate.candidateName || candidate.filename}
						</h2>
						{candidate.candidateName && (
							<p className="text-xs text-muted-foreground font-mono">
								File: {candidate.filename}
							</p>
						)}
					</div>

					<div className="flex items-center gap-3">
						<div className={`px-3 py-1.5 rounded-lg border text-center ${getScoreColor(candidate.fitScore)}`}>
							<div className="text-xs uppercase tracking-wider font-semibold">Overall Fit</div>
							<div className="text-xl font-black">{candidate.fitScore}%</div>
						</div>

						<button
							type="button"
							onClick={onClose}
							className="size-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
						>
							&times;
						</button>
					</div>
				</div>

				{/* Modal Body */}
				<div className="p-6 overflow-y-auto space-y-5 flex-1">
					{/* Backend Sub-Scores Breakdown */}
					{candidate.scoreBreakdown ? (
						<div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2">
							<div className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Hybrid AI Scoring Formula
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
								<div className="bg-background rounded-md p-2 border border-border/60">
									<span className="text-[10px] text-muted-foreground uppercase block font-medium">
										Required Skills (40%)
									</span>
									<span className="text-sm font-bold text-foreground">
										{candidate.scoreBreakdown.requiredSkills}%
									</span>
								</div>
								<div className="bg-background rounded-md p-2 border border-border/60">
									<span className="text-[10px] text-muted-foreground uppercase block font-medium">
										Preferred Skills (15%)
									</span>
									<span className="text-sm font-bold text-foreground">
										{candidate.scoreBreakdown.preferredSkills}%
									</span>
								</div>
								<div className="bg-background rounded-md p-2 border border-border/60">
									<span className="text-[10px] text-muted-foreground uppercase block font-medium">
										Experience (25%)
									</span>
									<span className="text-sm font-bold text-foreground">
										{candidate.scoreBreakdown.experience}%
									</span>
								</div>
								<div className="bg-background rounded-md p-2 border border-border/60">
									<span className="text-[10px] text-muted-foreground uppercase block font-medium">
										Semantic (20%)
									</span>
									<span className="text-sm font-bold text-foreground">
										{candidate.scoreBreakdown.semanticSimilarity}%
									</span>
								</div>
							</div>
						</div>
					) : candidate.scores && (
						<div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2">
							<div className="text-xs font-semibold text-foreground uppercase tracking-wider">
								Weighted Scoring Formula
							</div>
							<div className="grid grid-cols-3 gap-2 text-center">
								<div className="bg-background rounded-md p-2 border border-border/60">
									<span className="text-[10px] text-muted-foreground uppercase block font-medium">
										Skills (60%)
									</span>
									<span className="text-sm font-bold text-foreground">
										{candidate.scores.skills}%
									</span>
								</div>
								<div className="bg-background rounded-md p-2 border border-border/60">
									<span className="text-[10px] text-muted-foreground uppercase block font-medium">
										Experience (25%)
									</span>
									<span className="text-sm font-bold text-foreground">
										{candidate.scores.experience}%
									</span>
								</div>
								<div className="bg-background rounded-md p-2 border border-border/60">
									<span className="text-[10px] text-muted-foreground uppercase block font-medium">
										Education (15%)
									</span>
									<span className="text-sm font-bold text-foreground">
										{candidate.scores.education}%
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Explanation */}
					<div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-1">
						<div className="text-xs font-semibold text-foreground uppercase tracking-wider">
							Evaluation Summary
						</div>
						<p className="text-xs text-foreground/90 leading-relaxed">
							{candidate.explanation}
						</p>
					</div>

					{/* Strengths & Gaps Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{/* Strengths */}
						<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1.5">
							<div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
								<span>✓</span>
								<span>Matched Criteria</span>
							</div>
							<ul className="text-xs space-y-1 text-foreground/90 list-disc list-inside">
								{candidate.strengths.map((str, idx) => (
									<li key={idx} className="leading-snug">{str}</li>
								))}
							</ul>
						</div>

						{/* Gaps */}
						<div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1.5">
							<div className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
								<span>✕</span>
								<span>Missing Requirements</span>
							</div>
							<ul className="text-xs space-y-1 text-foreground/90 list-disc list-inside">
								{candidate.gaps.map((gap, idx) => (
									<li key={idx} className="leading-snug">{gap}</li>
								))}
							</ul>
						</div>
					</div>

					{/* Requirement Breakdown */}
					<div className="space-y-2">
						<div className="text-xs font-bold text-foreground uppercase tracking-wider">
							Detailed Evidence Breakdown
						</div>

						<div className="divide-y divide-border/60 rounded-lg border border-border overflow-hidden">
							{candidate.matches.map((item, idx) => (
								<div key={idx} className="p-3 space-y-1 bg-card">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<span className="text-xs font-semibold text-foreground capitalize">
												{item.requirement}
											</span>
											<span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
												{item.category}
											</span>
										</div>
										{getBadgeForStatus(item.status)}
									</div>

									<p className="text-xs text-muted-foreground italic pl-2 border-l-2 border-primary/30">
										&ldquo;{item.evidence}&rdquo;
									</p>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="p-4 border-t border-border/80 bg-muted/20 flex justify-end">
					<Button variant="outline" size="sm" onClick={onClose}>
						Close Breakdown
					</Button>
				</div>
			</div>
		</div>
	);
}
