import type { AIRequirement, CreateJobResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface JobRequirementsCardProps {
	job: CreateJobResponse;
	onReset: () => void;
	requirements: AIRequirement[] | null;
	isLoading: boolean;
	error: string | null;
	onRequirementsChange: (requirements: AIRequirement[]) => void;
}

export function JobRequirementsCard({ job, onReset, requirements, isLoading, error, onRequirementsChange }: JobRequirementsCardProps) {
	const updateRequirement = (index: number, update: Partial<AIRequirement>) => {
		if (!requirements) return;
		onRequirementsChange(requirements.map((requirement, requirementIndex) =>
			requirementIndex === index ? { ...requirement, ...update } : requirement,
		));
	};

	const removeRequirement = (index: number) => {
		if (!requirements) return;
		onRequirementsChange(requirements.filter((_, requirementIndex) => requirementIndex !== index));
	};

	const addRequirement = () => {
		onRequirementsChange([
			...(requirements ?? []),
			{ description: "", category: "skill", required: true, weight: 0.7 },
		]);
	};

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

			<div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Review AI-extracted requirements</h4>
						<p className="mt-1 text-[11px] text-muted-foreground">These requirements are specific to this position. Edit them before evaluating candidates.</p>
					</div>
					<Button variant="outline" size="sm" onClick={addRequirement} disabled={isLoading}>Add requirement</Button>
				</div>
				{isLoading && <p className="text-xs text-muted-foreground">Extracting requirements for this position...</p>}
				{error && <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
				{!isLoading && requirements && requirements.length === 0 && <p className="text-xs text-muted-foreground">Add at least one requirement before evaluating.</p>}
				<div className="space-y-2">
					{requirements?.map((requirement, index) => (
						<div key={`${index}-${requirement.description}`} className="grid gap-2 rounded-md border border-border/70 bg-background p-3 md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:items-center">
							<input
								value={requirement.description}
								onChange={(event) => updateRequirement(index, { description: event.target.value })}
								placeholder="Requirement description"
								className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
							/>
							<input
								value={requirement.category}
								onChange={(event) => updateRequirement(index, { category: event.target.value })}
								placeholder="Category"
								className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
							/>
							<label className="flex items-center gap-2 text-xs text-muted-foreground">
								<input type="checkbox" checked={requirement.required} onChange={(event) => updateRequirement(index, { required: event.target.checked })} />
								Required
							</label>
							<div className="flex items-center gap-2">
								<input type="number" min="0.1" max="1" step="0.1" value={requirement.weight} onChange={(event) => updateRequirement(index, { weight: Number(event.target.value) })} className="w-20 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground" aria-label="Requirement weight" />
								<button type="button" onClick={() => removeRequirement(index)} className="text-xs font-semibold text-rose-600 hover:underline" aria-label={`Remove requirement ${index + 1}`}>Remove</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
