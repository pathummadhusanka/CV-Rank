import { useEffect } from "react";
import { CVUploader, type UploadedCandidate } from "@/components/CVUploader";
import { Button } from "@/components/ui/button";

interface UploadCVModalProps {
	onCandidatesChange: (candidates: UploadedCandidate[]) => void;
	onClose: () => void;
}

export function UploadCVModal({ onCandidatesChange, onClose }: UploadCVModalProps) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
			<button
				type="button"
				className="fixed inset-0 cursor-default"
				onClick={onClose}
				aria-label="Close upload dialog"
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="upload-cv-modal-title"
				className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card p-6 shadow-2xl overflow-y-auto space-y-4"
			>
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-border/60 pb-3">
					<div>
						<h2 id="upload-cv-modal-title" className="text-lg font-bold text-foreground">
							Upload Candidate Resumes (PDF)
						</h2>
						<p className="text-xs text-muted-foreground">
							Upload PDF resumes into the system CV library to evaluate them against job criteria.
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground text-lg font-semibold p-1 cursor-pointer"
					>
						&times;
					</button>
				</div>

				{/* Uploader Dropzone & Queue */}
				<CVUploader onCandidatesChange={onCandidatesChange} hideHeader />

				{/* Footer */}
				<div className="flex justify-end pt-2 border-t border-border/60">
					<Button onClick={onClose}>Done</Button>
				</div>
			</div>
		</div>
	);
}
