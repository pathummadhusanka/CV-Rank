import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { CreateBatchModal } from "@/components/CreateBatchModal";
import { CVUploader } from "@/components/CVUploader";
import { deleteCV, getCVs, type CVSummary } from "@/lib/api";
import { deleteStoredBatch, getStoredBatches, sanitizeStoredBatches, saveStoredBatch, type CVBatch } from "@/lib/storage";

function DocumentIcon({ className = "size-3" }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
		</svg>
	);
}

export default function CVLibraryPage() {
	const navigate = useNavigate();
	const [cvs, setCVs] = useState<CVSummary[]>([]);
	const [selectedCVIds, setSelectedCVIds] = useState<string[]>([]);
	const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [batches, setBatches] = useState<CVBatch[]>(() => getStoredBatches());
	const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);

	useEffect(() => {
		void refreshCVs();
	}, []);

	const refreshCVs = async () => {
		try {
			const fetched = await getCVs();
			setCVs(fetched);
			setBatches(sanitizeStoredBatches(fetched.map((cv) => cv.id)));
		} catch {
			setCVs([]);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDeleteIds) return;
		setIsDeleting(true);
		await Promise.all(pendingDeleteIds.map((cvId) => deleteCV(cvId)));
		const remaining = cvs.filter((cv) => !pendingDeleteIds.includes(cv.id));
		setCVs(remaining);
		setSelectedCVIds((currentIds) => currentIds.filter((id) => !pendingDeleteIds.includes(id)));
		setBatches(sanitizeStoredBatches(remaining.map((cv) => cv.id)));
		setPendingDeleteIds(null);
		setIsDeleting(false);
	};

	const handleSaveBatch = (name: string, description: string) => {
		if (selectedCVIds.length === 0) return;
		const newBatch: CVBatch = {
			id: `batch-${Date.now()}`,
			name,
			description,
			cvIds: selectedCVIds,
			createdAt: new Date().toISOString(),
		};
		const updated = saveStoredBatch(newBatch);
		setBatches(updated);
		setShowCreateBatchModal(false);
		setSelectedCVIds([]);
	};

	const handleDeleteBatch = (batchId: string) => {
		const updated = deleteStoredBatch(batchId);
		setBatches(updated);
	};

	const handleEvaluateBatch = (batchId: string) => {
		navigate(`/evaluations?batchId=${batchId}`);
	};

	const toggleSelectAll = () => {
		if (selectedCVIds.length === cvs.length) {
			setSelectedCVIds([]);
		} else {
			setSelectedCVIds(cvs.map((cv) => cv.id));
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">CV Library &amp; Batches</h1>
					<p className="text-sm text-muted-foreground">Manage uploaded candidate CVs and group them into reusable evaluation batches.</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{selectedCVIds.length > 0 && (
						<>
							<Button size="sm" onClick={() => setShowCreateBatchModal(true)}>
								+ Create Batch ({selectedCVIds.length})
							</Button>
							<Button variant="destructive" size="sm" onClick={() => setPendingDeleteIds(selectedCVIds)}>
								Delete Selected ({selectedCVIds.length})
							</Button>
							<Button variant="outline" size="sm" onClick={() => setSelectedCVIds([])}>
								Clear Selection
							</Button>
						</>
					)}
					{cvs.length > 0 && selectedCVIds.length === 0 && (
						<Button variant="outline" size="sm" onClick={toggleSelectAll}>
							Select All ({cvs.length})
						</Button>
					)}
				</div>
			</div>

			{/* Saved CV Batches Section */}
			{batches.length > 0 && (
				<section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
					<div className="flex items-center justify-between pb-2 border-b border-border/60">
						<div>
							<h2 className="text-base font-bold text-foreground">Saved CV Batches ({batches.length})</h2>
							<p className="text-xs text-muted-foreground">Pre-grouped candidate pools for fast one-click evaluations.</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{batches.map((batch) => {
							const includedCVs = cvs.filter((cv) => batch.cvIds.includes(cv.id));
							return (
								<div key={batch.id} className="rounded-lg border border-border/70 bg-background p-4 flex flex-col justify-between gap-3">
									<div className="space-y-2">
										<div className="flex items-start justify-between gap-2">
											<div>
												<h3 className="text-sm font-bold text-foreground">{batch.name}</h3>
												{batch.description && <p className="text-xs text-muted-foreground mt-0.5">{batch.description}</p>}
											</div>
											<span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary shrink-0">
												{batch.cvIds.length} CV{batch.cvIds.length === 1 ? "" : "s"}
											</span>
										</div>

										<div className="flex flex-wrap gap-1.5 pt-1">
											{includedCVs.length > 0 ? (
												includedCVs.map((cv) => (
													<span key={cv.id} className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground font-medium truncate max-w-[180px]">
														<DocumentIcon className="size-3 text-muted-foreground shrink-0" />
														<span className="truncate">{cv.filename}</span>
													</span>
												))
											) : (
												<span className="text-[11px] text-muted-foreground italic">Contains {batch.cvIds.length} candidate reference(s)</span>
											)}
										</div>
									</div>

									<div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
										<span className="text-[11px] text-muted-foreground">
											Created {new Date(batch.createdAt).toLocaleDateString()}
										</span>
										<div className="flex items-center gap-2">
											<Button variant="outline" size="sm" onClick={() => handleDeleteBatch(batch.id)}>
												Delete
											</Button>
											<Button size="sm" onClick={() => handleEvaluateBatch(batch.id)}>
												Evaluate in Workspace &rarr;
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			)}

			{/* CVs Grid */}
			{cvs.length === 0 ? (
				<div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
					No CVs have been uploaded yet. Use the dropzone below to upload candidate resumes.
				</div>
			) : (
				<div className="space-y-3">
					<div className="flex items-center justify-between text-xs text-muted-foreground px-1">
						<span>All Resumes in Library ({cvs.length})</span>
						<button type="button" onClick={toggleSelectAll} className="text-primary hover:underline font-semibold cursor-pointer">
							{selectedCVIds.length === cvs.length ? "Deselect All" : "Select All"}
						</button>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						{cvs.map((cv) => {
							const isSelected = selectedCVIds.includes(cv.id);

							return (
								<div
									key={cv.id}
									className={`rounded-xl border p-4 transition-all ${
										isSelected
											? "border-primary/50 bg-primary/5 shadow-xs"
											: "border-border bg-card hover:border-border/80"
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<label className="flex items-start gap-3 min-w-0 cursor-pointer flex-1">
											<input
												type="checkbox"
												checked={isSelected}
												onChange={(event) =>
													setSelectedCVIds((currentIds) =>
														event.target.checked
															? [...currentIds, cv.id]
															: currentIds.filter((id) => id !== cv.id),
													)
												}
												className="mt-1 shrink-0"
											/>
											<div className="min-w-0">
												<h2 className="truncate text-sm font-bold text-foreground">{cv.filename}</h2>
												<p className="mt-1 text-xs text-muted-foreground">Uploaded {new Date(cv.created_at).toLocaleString()}</p>
											</div>
										</label>

										<div className="flex items-center gap-2 shrink-0">
											<span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{cv.status}</span>
											<button
												type="button"
												onClick={() => setPendingDeleteIds([cv.id])}
												className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors text-base font-semibold cursor-pointer leading-none"
												title="Delete CV"
											>
												&times;
											</button>
										</div>
									</div>
									<p className="mt-3 text-xs text-muted-foreground pl-6">{cv.skills || "No detected skills"}</p>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{showCreateBatchModal && (
				<CreateBatchModal
					selectedCount={selectedCVIds.length}
					onCancel={() => setShowCreateBatchModal(false)}
					onSave={handleSaveBatch}
				/>
			)}

			{pendingDeleteIds && (
				<ConfirmDeleteModal
					count={pendingDeleteIds.length}
					itemLabel="CV"
					isDeleting={isDeleting}
					onCancel={() => setPendingDeleteIds(null)}
					onConfirm={handleConfirmDelete}
				/>
			)}

			<section>
				<CVUploader onCandidatesChange={() => { void refreshCVs(); }} />
			</section>
		</div>
	);
}