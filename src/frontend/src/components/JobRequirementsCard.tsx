import type { CreateJobResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface JobRequirementsCardProps {
	job: CreateJobResponse;
	onReset: () => void;
}

export function JobRequirementsCard({ job, onReset }: JobRequirementsCardProps) {
	const { requirements } = job;
	const hasSkills = requirements.skills && requirements.skills.length > 0;

	return (
		<div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
							Active Job Target
						</span>
						<span className="text-xs text-muted-foreground font-mono">
							ID: {job.id.slice(0, 8)}...
						</span>
					</div>
					<h3 className="text-lg font-bold text-foreground tracking-tight">
						{job.title}
					</h3>
				</div>

				<Button variant="outline" size="sm" onClick={onReset}>
					Change Job
				</Button>
			</div>

			<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* Skills Card */}
				<div className="sm:col-span-3 rounded-lg border border-border/80 bg-muted/30 p-3.5">
					<div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
						<span>Detected Skills ({requirements.skills.length})</span>
						<span className="text-[11px] text-muted-foreground font-normal">Extracted from description</span>
					</div>
					{hasSkills ? (
						<div className="flex flex-wrap gap-1.5">
							{requirements.skills.map((skill) => (
								<span
									key={skill}
									className="inline-flex items-center rounded-md bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-medium capitalize"
								>
									{skill}
								</span>
							))}
						</div>
					) : (
						<p className="text-xs text-muted-foreground italic">
							No predefined skills recognized in the description text.
						</p>
					)}
				</div>

				{/* Experience requirement */}
				<div className="rounded-lg border border-border/80 bg-muted/30 p-3.5">
					<div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
						Experience Required
					</div>
					<div className="text-sm font-semibold text-foreground">
						{requirements.experience_years !== null ? (
							<span className="text-emerald-600 dark:text-emerald-400 font-bold">
								{requirements.experience_years}+ Years
							</span>
						) : (
							<span className="text-muted-foreground font-normal">Not specified</span>
						)}
					</div>
				</div>

				{/* Education requirement */}
				<div className="rounded-lg border border-border/80 bg-muted/30 p-3.5">
					<div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
						Education Level
					</div>
					<div className="text-sm font-semibold text-foreground capitalize">
						{requirements.education ? (
							<span className="text-emerald-600 dark:text-emerald-400 font-bold">
								{requirements.education}
							</span>
						) : (
							<span className="text-muted-foreground font-normal">Not specified</span>
						)}
					</div>
				</div>

				{/* Status info */}
				<div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 flex flex-col justify-center">
					<div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
						Matching Engine
					</div>
					<div className="text-xs text-muted-foreground">
						Ready to match uploaded CVs against criteria
					</div>
				</div>
			</div>
		</div>
	);
}
