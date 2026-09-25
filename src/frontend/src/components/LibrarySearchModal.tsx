import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CreateJobResponse, CVSummary } from "@/lib/api";
import type { CVBatch } from "@/lib/storage";

interface LibrarySearchModalProps {
	initialMode?: "jobs" | "cvs" | "batches" | "all";
	jobs: CreateJobResponse[];
	cvs: CVSummary[];
	batches: CVBatch[];
	selectedJobId?: string | null;
	selectedCVIds: string[];
	onSelectJob?: (job: CreateJobResponse) => void;
	onToggleCV?: (cvId: string, selected: boolean) => void;
	onToggleBatch?: (batch: CVBatch, selected: boolean) => void;
	onClose: () => void;
}

export function LibrarySearchModal({
	initialMode = "all",
	jobs,
	cvs,
	batches,
	selectedJobId,
	selectedCVIds,
	onSelectJob,
	onToggleCV,
	onToggleBatch,
	onClose,
}: LibrarySearchModalProps) {
	const [activeTab, setActiveTab] = useState<"jobs" | "cvs" | "batches" | "all">(initialMode);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const query = searchQuery.toLowerCase().trim();

	const filteredJobs = jobs.filter(
		(job) =>
			!query ||
			job.title.toLowerCase().includes(query) ||
			job.description.toLowerCase().includes(query) ||
			job.requirements.skills.some((s) => s.toLowerCase().includes(query)),
	);

	const filteredCVs = cvs.filter(
		(cv) =>
			!query ||
			cv.filename.toLowerCase().includes(query) ||
			(cv.skills && cv.skills.toLowerCase().includes(query)),
	);

	const filteredBatches = batches.filter(
		(batch) =>
			!query ||
			batch.name.toLowerCase().includes(query) ||
			(batch.description && batch.description.toLowerCase().includes(query)),
	);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
			<button
				type="button"
				className="fixed inset-0 cursor-default"
				onClick={onClose}
				aria-label="Close search modal"
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="library-search-title"
				className="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-4 overflow-hidden"
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border/60 pb-3">
					<div>
						<h2 id="library-search-title" className="text-lg font-bold text-foreground">
							Search and add from library
						</h2>
						<p className="text-xs text-muted-foreground">
							Find and select job positions, candidate batches, or individual resumes.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground p-1 text-lg font-semibold cursor-pointer"
					>
						&times;
					</button>
				</div>

				{/* Search Bar & Category Filter Tabs */}
				<div className="space-y-3">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by job title, candidate name, skill, or batch name..."
						className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
						autoFocus
					/>

					<div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
						<button
							type="button"
							onClick={() => setActiveTab("all")}
							className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
								activeTab === "all" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
							}`}
						>
							All ({jobs.length + cvs.length + batches.length})
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("jobs")}
							className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
								activeTab === "jobs" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
							}`}
						>
							Jobs ({jobs.length})
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("batches")}
							className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
								activeTab === "batches" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
							}`}
						>
							CV Batches ({batches.length})
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("cvs")}
							className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
								activeTab === "cvs" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
							}`}
						>
							Individual Resumes ({cvs.length})
						</button>
					</div>
				</div>

				{/* Results List (Scrollable) */}
				<div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
					{/* Jobs Section */}
					{(activeTab === "all" || activeTab === "jobs") && onSelectJob && (
						<div className="space-y-2">
							<span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px] block">
								Job Roles ({filteredJobs.length})
							</span>
							{filteredJobs.length === 0 ? (
								<p className="text-muted-foreground italic">No matching job positions found.</p>
							) : (
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									{filteredJobs.map((job) => {
										const isSelected = selectedJobId === job.id;
										return (
											<button
												key={job.id}
												type="button"
												onClick={() => {
													onSelectJob(job);
													onClose();
												}}
												className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
													isSelected
														? "border-primary bg-primary/10 shadow-xs"
														: "border-border bg-background hover:border-primary/50"
												}`}
											>
												<div className="flex items-center justify-between gap-2">
													<strong className="text-foreground truncate">{job.title}</strong>
													{isSelected && <span className="text-[10px] font-bold text-primary">Selected</span>}
												</div>
												<p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{job.description}</p>
											</button>
										);
									})}
								</div>
							)}
						</div>
					)}

					{/* CV Batches Section */}
					{(activeTab === "all" || activeTab === "batches") && onToggleBatch && (
						<div className="space-y-2">
							<span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px] block">
								CV Batches ({filteredBatches.length})
							</span>
							{filteredBatches.length === 0 ? (
								<p className="text-muted-foreground italic">No matching candidate batches found.</p>
							) : (
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									{filteredBatches.map((batch) => {
										const allSelected = batch.cvIds.length > 0 && batch.cvIds.every((id) => selectedCVIds.includes(id));
										return (
											<label
												key={batch.id}
												className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
													allSelected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-border/80"
												}`}
											>
												<input
													type="checkbox"
													checked={allSelected}
													onChange={(e) => onToggleBatch(batch, e.target.checked)}
													className="mt-0.5 shrink-0"
												/>
												<div className="min-w-0">
													<div className="flex items-center gap-2">
														<strong className="text-foreground truncate">{batch.name}</strong>
														<span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
															{batch.cvIds.length} CVs
														</span>
													</div>
													{batch.description && (
														<p className="text-muted-foreground text-[11px] truncate mt-0.5">{batch.description}</p>
													)}
												</div>
											</label>
										);
									})}
								</div>
							)}
						</div>
					)}

					{/* Individual Resumes Section */}
					{(activeTab === "all" || activeTab === "cvs") && onToggleCV && (
						<div className="space-y-2">
							<span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px] block">
								Individual Resumes ({filteredCVs.length})
							</span>
							{filteredCVs.length === 0 ? (
								<p className="text-muted-foreground italic">No matching resumes found.</p>
							) : (
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									{filteredCVs.map((cv) => {
										const isSelected = selectedCVIds.includes(cv.id);
										return (
											<label
												key={cv.id}
												className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
													isSelected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-border/80"
												}`}
											>
												<input
													type="checkbox"
													checked={isSelected}
													onChange={(e) => onToggleCV(cv.id, e.target.checked)}
													className="shrink-0"
												/>
												<span className="text-foreground font-medium truncate min-w-0">{cv.filename}</span>
											</label>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex justify-end pt-2 border-t border-border/60">
					<Button onClick={onClose}>Done</Button>
				</div>
			</div>
		</div>
	);
}
