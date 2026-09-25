import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface CreateBatchModalProps {
	selectedCount: number;
	onCancel: () => void;
	onSave: (name: string, description: string) => void;
}

export function CreateBatchModal({ selectedCount, onCancel, onSave }: CreateBatchModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onCancel]);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!name.trim()) {
			setError("Batch name is required.");
			return;
		}
		onSave(name.trim(), description.trim());
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
			<button
				type="button"
				className="fixed inset-0 cursor-default"
				onClick={onCancel}
				aria-label="Close modal dialog"
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="create-batch-title"
				className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
			>
				<div>
					<h2 id="create-batch-title" className="text-lg font-bold text-foreground">
						Create CV Batch ({selectedCount} CV{selectedCount === 1 ? "" : "s"})
					</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						Group selected CVs into a reusable batch for quick candidate evaluations.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground block">Batch Name</label>
						<input
							type="text"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setError(null);
							}}
							placeholder="e.g. Q3 Frontend Applicants"
							className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
							autoFocus
						/>
						{error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground block">Description (Optional)</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g. Shortlisted backend developer resumes for round 1"
							rows={3}
							className="w-full resize-none rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2 border-t border-border/60">
						<Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
						<Button type="submit">Create Batch</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
