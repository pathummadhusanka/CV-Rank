import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { JobCreator } from "@/components/JobCreator";
import { getJobs, deleteJob, updateJob, type CreateJobResponse } from "@/lib/api";

export default function JobsPage() {
	const navigate = useNavigate();
	const [jobs, setJobs] = useState<CreateJobResponse[]>([]);
	const [showCreator, setShowCreator] = useState(false);
	const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
	const [isDeleteMode, setIsDeleteMode] = useState(false);
	const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editingJobId, setEditingJobId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

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
		navigate(`/evaluations?jobId=${jobId}`);
	};

	const startEditing = (job: CreateJobResponse) => {
		setEditingJobId(job.id);
		setEditTitle(job.title);
		setEditDescription(job.description);
		setEditError(null);
	};

	const cancelEditing = () => {
		setEditingJobId(null);
		setEditError(null);
	};

	const saveEditing = async (jobId: string) => {
		if (!editTitle.trim() || !editDescription.trim()) {
			setEditError("Title and description are required.");
			return;
		}
		setIsSaving(true);
		setEditError(null);
		try {
			const updatedJob = await updateJob(jobId, {
				title: editTitle.trim(),
				description: editDescription.trim(),
			});
			setJobs((currentJobs) => currentJobs.map((job) => job.id === jobId ? updatedJob : job));
			setEditingJobId(null);
		} catch (error) {
			setEditError(error instanceof Error ? error.message : "Could not update this job.");
		} finally {
			setIsSaving(false);
		}
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
						Manage position titles and descriptions used to evaluate and rank candidate CVs.
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
									{isDeleteMode && (
										<label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
											<input
												type="checkbox"
												checked={selectedJobIds.includes(job.id)}
												onChange={(event) =>
													setSelectedJobIds((currentIds) =>
														event.target.checked
															? [...currentIds, job.id]
															: currentIds.filter((id) => id !== job.id),
													)
												}
											/>
											Select
										</label>
									)}
									<div className="flex items-center gap-2 mb-1.5">
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

							<p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
								{job.description}
							</p>

							{editingJobId === job.id && (
								<div className="space-y-3 rounded-lg border border-border/70 bg-background p-3 mt-3">
									<label className="block space-y-1 text-xs font-semibold text-foreground">
										Title
										<input
											value={editTitle}
											onChange={(event) => setEditTitle(event.target.value)}
											className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal"
										/>
									</label>
									<label className="block space-y-1 text-xs font-semibold text-foreground">
										Description
										<textarea
											value={editDescription}
											onChange={(event) => setEditDescription(event.target.value)}
											rows={7}
											className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal"
										/>
									</label>
									{editError && <p className="text-xs text-rose-700 dark:text-rose-300">{editError}</p>}
									<div className="flex justify-end gap-2">
										<Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>Cancel</Button>
										<Button size="sm" onClick={() => saveEditing(job.id)} disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</Button>
									</div>
								</div>
							)}
						</div>

						{/* Action */}
						<div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
							{editingJobId !== job.id && <Button variant="outline" size="sm" onClick={() => startEditing(job)}>Edit job</Button>}
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
