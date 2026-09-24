import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteModalProps {
	count: number;
	itemLabel: string;
	isDeleting?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export function ConfirmDeleteModal({
	count,
	itemLabel,
	isDeleting = false,
	onCancel,
	onConfirm,
}: ConfirmDeleteModalProps) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !isDeleting) onCancel();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isDeleting, onCancel]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs">
			<button
				type="button"
				className="fixed inset-0 cursor-default"
				onClick={() => !isDeleting && onCancel()}
				aria-label="Close confirmation dialog"
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirm-delete-title"
				className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
			>
				<h2 id="confirm-delete-title" className="text-lg font-bold text-foreground">
					Delete {count} {itemLabel}{count === 1 ? "" : "s"}?
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					This action permanently removes the selected {itemLabel}{count === 1 ? "" : "s"} from the database. It cannot be undone.
				</p>
				<div className="mt-6 flex justify-end gap-2">
					<Button variant="outline" onClick={onCancel} disabled={isDeleting}>Cancel</Button>
					<Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</div>
			</div>
		</div>
	);
}
