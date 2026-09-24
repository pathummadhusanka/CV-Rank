import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { JobCreator } from "@/components/JobCreator";
import { getJobs, deleteJob, type CreateJobResponse } from "@/lib/api";

export default function JobsPage() {
	const navigate = useNavigate();
	const [jobs, setJobs] = useState<CreateJobResponse[]>([]);
	const [showCreator, setShowCreator] = useState(false);
	const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
	const [isDeleteMode, setIsDeleteMode] = useState(false);
	const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		getJobs()
			.then((loadedJobs) => {
				setJobs(loadedJobs);
			})
			.catch(() => {
				setJobs([]);
			});
	}, []);

	const handleJobCreated = (newJob: CreateJobResponse) => {
		setJobs((currentJobs) => [newJob, ...currentJobs]);
		setShowCreator(false);
	};

	const handleConfirmDelete = async () => {
		if (!pendingDeleteIds) return;
		setIsDeleting(true);
		await Promise.all(pendingDeleteIds.map((jobId) => deleteJob(jobId)));
		setJobs((currentJobs) => currentJobs.filter((job) => !pendingDeleteIds.includes(job.id)));
		setSelectedJobIds((currentIds) => currentIds.filter((id) => !pendingDeleteIds.includes(id)));
		setIsDeleteMode(false);
		setPendingDeleteIds(null);
		setIsDeleting(false);
	};

	const handleStartEvaluation = (jobId: string) => {
		navigate(`/?jobId=${jobId}`);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Job Positions Library
					</h1>
					<p className="text-sm text-muted-foreground">
						Manage position criteria and requirements used to evaluate and rank candidate CVs.
					</p>
				</div>

				<div className="flex items-center gap-2">
					{isDeleteMode ? (
						<>
							<Button variant="outline" size="sm" onClick={() => { setIsDeleteMode(false); setSelectedJobIds([]); }}>
								Cancel
							</Button>
							{selectedJobIds.length > 0 && (
								<Button variant="destructive" size="sm" onClick={() => setPendingDeleteIds(selectedJobIds)}>
									Delete Selected ({selectedJobIds.length})
								</Button>
							)}
						</>
					) : jobs.length > 0 ? (
						<Button variant="destructive" size="sm" onClick={() => setIsDeleteMode(true)}>
							Delete
						</Button>
					) : null}
					<Button
						onClick={() => setShowCreator(!showCreator)}
						variant={showCreator ? "outline" : "default"}
					>
						{showCreator ? "Cancel" : "+ Add New Position"}
					</Button>
				</div>
			</div>

			{/* Creator Drawer/Card */}
			{showCreator && (
				<div className="animate-in fade-in duration-200">
					<JobCreator onJobCreated={handleJobCreated} />
				</div>
			)}

			{/* Jobs Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{jobs.map((job) => (
					<div
						key={job.id}
						className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-primary/40 transition-colors"
					>
						<div className="space-y-3">
							<div className="flex items-start justify-between gap-2">
								<div>
											{isDeleteMode && <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
												<input
													type="checkbox"
													checked={selectedJobIds.includes(job.id)}
													onChange={(event) => setSelectedJobIds((currentIds) => event.target.checked
														? [...currentIds, job.id]
														: currentIds.filter((id) => id !== job.id))}
												/>
												Select
											</label>}
									<div className="flex items-center gap-2 mb-1">
										<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
											ID: {job.id.slice(0, 8)}...
										</span>
										<span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
											Active
										</span>
									</div>
									<h3 className="text-base font-bold text-foreground">
										{job.title}
									</h3>
								</div>

							</div>

							{/* Extracted criteria chips */}
							<div className="space-y-2">
								<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									Required Skills ({job.requirements.skills.length})
								</div>
								<div className="flex flex-wrap gap-1.5">
									{job.requirements.skills.map((skill) => (
										<span
											key={skill}
											className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground border border-border px-2 py-0.5 text-xs font-medium capitalize"
										>
											{skill}
										</span>
									))}
								</div>
							</div>

							{/* Experience & Education */}
							<div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
								<div>
									<span className="text-muted-foreground block text-[11px]">Experience:</span>
									<span className="font-semibold text-foreground">
										{job.requirements.experience_years !== null
											? `${job.requirements.experience_years}+ Years`
											: "Not specified"}
									</span>
								</div>
								<div>
									<span className="text-muted-foreground block text-[11px]">Education:</span>
									<span className="font-semibold text-foreground capitalize">
										{job.requirements.education || "Not specified"}
									</span>
								</div>
							</div>
						</div>

						{/* Action */}
						<div className="pt-3 border-t border-border/60 flex items-center justify-end">
							<Button
								size="sm"
								onClick={() => handleStartEvaluation(job.id)}
							>
								Start Evaluation Run &rarr;
							</Button>
						</div>
					</div>
				))}
			</div>

			{pendingDeleteIds && (
				<ConfirmDeleteModal
					count={pendingDeleteIds.length}
					itemLabel="job"
					isDeleting={isDeleting}
					onCancel={() => setPendingDeleteIds(null)}
					onConfirm={handleConfirmDelete}
				/>
			)}
		</div>
	);
}
