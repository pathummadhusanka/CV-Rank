import type { AIRequirement, CreateJobResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";

const COMMON_CATEGORIES = [
	"skill",
	"tool or technology",
	"experience",
	"education",
	"certification",
	"language",
	"responsibility",
	"domain knowledge",
	"industry knowledge",
	"soft skill",
	"leadership",
	"communication",
	"portfolio",
	"availability",
	"location or work authorization",
	"compliance",
] as const;

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
					Close selected job
				</Button>
			</div>

			<div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
								Review AI-extracted requirements
								<InfoHint text="These requirements were extracted for this position. Review them before evaluating candidates." />
							</h4>
							<span className={`rounded-md border bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-rose-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-normal text-violet-700 dark:text-rose-300 ${isLoading ? "animate-pulse border-violet-400/50" : "border-rose-400/30"}`}>
								{isLoading ? "AI extracting" : "AI extracted"}
							</span>
						</div>
						<p className="mt-1 text-[11px] text-muted-foreground">These requirements are specific to this position. Edit them before evaluating candidates.</p>
					</div>
					<Button variant="outline" size="sm" onClick={addRequirement} disabled={isLoading}>Add requirement</Button>
				</div>
				{isLoading && <p className="text-xs text-muted-foreground">Extracting requirements for this position...</p>}
				{error && <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
				{!isLoading && requirements && requirements.length === 0 && <p className="text-xs text-muted-foreground">Add at least one requirement before evaluating.</p>}
				<div className="space-y-2">
					{requirements && requirements.length > 0 && (
						<div className="hidden grid-cols-[minmax(0,1fr)_9rem_8rem_auto] gap-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
							<span className="flex items-center gap-1">Requirement <InfoHint text="The job-related capability or qualification to look for in each CV." /></span>
							<span className="flex items-center gap-1">Category <InfoHint text="Groups the requirement, such as skill, experience, education, or certification." /></span>
							<span className="flex items-center gap-1">Importance <InfoHint text="Required means the role expects it. Clear the checkbox for a preferred requirement." /></span>
							<span className="flex items-center gap-1">Weight (1–10) / Actions <InfoHint text="Higher weight gives this requirement more influence within its category. 10 is highest priority." /></span>
						</div>
					)}
					{requirements?.map((requirement, index) => {
						const isCustomCategory = !COMMON_CATEGORIES.includes(requirement.category as typeof COMMON_CATEGORIES[number]);
						return (
						<div key={`${index}-${requirement.description}`} className="grid gap-2 rounded-md border border-border/70 bg-background p-3 md:grid-cols-[minmax(0,1fr)_9rem_8rem_auto] md:items-center">
							<input
								value={requirement.description}
								onChange={(event) => updateRequirement(index, { description: event.target.value })}
								placeholder="Requirement description"
								className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
							/>
							<div className="space-y-1">
								<select
									value={COMMON_CATEGORIES.includes(requirement.category as typeof COMMON_CATEGORIES[number]) ? requirement.category : "custom"}
									onChange={(event) => updateRequirement(index, { category: event.target.value === "custom" ? "" : event.target.value })}
									className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
									aria-label="Requirement category"
								>
									{COMMON_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
									<option value="custom">Custom category</option>
								</select>
								{isCustomCategory && (
									<input
										value={requirement.category}
										onChange={(event) => updateRequirement(index, { category: event.target.value })}
										placeholder="Enter category"
										className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
										aria-label="Custom requirement category"
									/>
								)}
							</div>
							<label className="flex items-center gap-2 text-xs text-muted-foreground">
								<input type="checkbox" checked={requirement.required} onChange={(event) => updateRequirement(index, { required: event.target.checked })} />
								Required
							</label>
							<div className="flex items-center gap-2">
								<input type="number" min="1" max="10" step="1" value={Math.round(requirement.weight * 10)} onChange={(event) => updateRequirement(index, { weight: Math.min(10, Math.max(1, Number(event.target.value))) / 10 })} className="w-20 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground" aria-label="Requirement weight from 1 to 10" />
								<button type="button" onClick={() => removeRequirement(index)} className="text-xs font-semibold text-rose-600 hover:underline" aria-label={`Remove requirement ${index + 1}`}>Remove</button>
							</div>
						</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function InfoHint({ text }: { text: string }) {
	return (
		<span className="group relative inline-flex">
			<button
				type="button"
				aria-label={text}
				className="inline-flex size-4 items-center justify-center rounded-full border border-muted-foreground/50 text-[10px] font-bold normal-case tracking-normal text-muted-foreground hover:border-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			>
				i
			</button>
			<span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 rounded-md bg-foreground px-2.5 py-2 text-left text-[11px] font-normal normal-case tracking-normal text-background shadow-lg group-hover:block group-focus-within:block">
				{text}
			</span>
		</span>
	);
}
