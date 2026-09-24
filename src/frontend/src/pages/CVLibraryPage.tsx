import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { CVUploader } from "@/components/CVUploader";
import { deleteCV, getCVs, type CVSummary } from "@/lib/api";

export default function CVLibraryPage() {
	const [cvs, setCVs] = useState<CVSummary[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [selectedCVIds, setSelectedCVIds] = useState<string[]>([]);
	const [isDeleteMode, setIsDeleteMode] = useState(false);
	const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		refreshCVs().catch((reason: unknown) => {
			setError(reason instanceof Error ? reason.message : "Could not load CVs");
		});
	}, []);

	const refreshCVs = async () => {
		setCVs(await getCVs());
	};

	const handleConfirmDelete = async () => {
		if (!pendingDeleteIds) return;
		setIsDeleting(true);
		await Promise.all(pendingDeleteIds.map((cvId) => deleteCV(cvId)));
		setCVs((currentCVs) => currentCVs.filter((cv) => !pendingDeleteIds.includes(cv.id)));
		setSelectedCVIds((currentIds) => currentIds.filter((id) => !pendingDeleteIds.includes(id)));
		setIsDeleteMode(false);
		setPendingDeleteIds(null);
		setIsDeleting(false);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">CV Library</h1>
					<p className="text-sm text-muted-foreground">Uploaded CVs are stored here and can be reused across evaluations.</p>
				</div>
				<div className="flex items-center gap-2">
					{isDeleteMode ? (
						<>
							<Button variant="outline" size="sm" onClick={() => { setIsDeleteMode(false); setSelectedCVIds([]); }}>
								Cancel
							</Button>
							{selectedCVIds.length > 0 && (
								<Button variant="destructive" size="sm" onClick={() => setPendingDeleteIds(selectedCVIds)}>
									Delete Selected ({selectedCVIds.length})
								</Button>
							)}
						</>
					) : cvs.length > 0 ? (
						<Button variant="destructive" size="sm" onClick={() => setIsDeleteMode(true)}>
							Delete
						</Button>
					) : null}
				</div>
			</div>

			{error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-700">{error}</p>}
			{!error && cvs.length === 0 ? (
				<div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
					No CVs have been uploaded yet.
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					{cvs.map((cv) => (
						<div key={cv.id} className="rounded-xl border border-border bg-card p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									{isDeleteMode && <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
										<input
											type="checkbox"
											checked={selectedCVIds.includes(cv.id)}
											onChange={(event) => setSelectedCVIds((currentIds) => event.target.checked
												? [...currentIds, cv.id]
												: currentIds.filter((id) => id !== cv.id))}
										/>
										Select
									</label>}
									<h2 className="truncate text-sm font-bold text-foreground">{cv.filename}</h2>
									<p className="mt-1 text-xs text-muted-foreground">Uploaded {new Date(cv.created_at).toLocaleString()}</p>
								</div>
								<div className="flex items-center gap-2">
									<span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{cv.status}</span>
								</div>
							</div>
							<p className="mt-3 text-xs text-muted-foreground">{cv.skills || "No detected skills"}</p>
						</div>
					))}
				</div>
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