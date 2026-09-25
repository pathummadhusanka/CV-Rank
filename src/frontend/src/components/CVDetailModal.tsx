import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCVDetail, updateCVText, type CVDetail } from "@/lib/api";

interface CVDetailModalProps {
	cvId: string | null;
	onClose: () => void;
	onSaveSuccess?: () => void;
}

export function CVDetailModal({ cvId, onClose, onSaveSuccess }: CVDetailModalProps) {
	const [cvDetail, setCVDetail] = useState<CVDetail | null>(null);
	const [activeTab, setActiveTab] = useState<"text" | "pdf">("text");
	const [editedText, setEditedText] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saveMessage, setSaveMessage] = useState<string | null>(null);
	const [pdfFailed, setPdfFailed] = useState(false);

	useEffect(() => {
		if (!cvId) return;
		let mounted = true;
		setIsLoading(true);
		setError(null);
		setSaveMessage(null);
		setPdfFailed(false);

		getCVDetail(cvId)
			.then((detail) => {
				if (mounted) {
					setCVDetail(detail);
					setEditedText(detail.extracted_text);
				}
			})
			.catch((err) => {
				if (mounted) {
					setError(err instanceof Error ? err.message : "Failed to load CV details.");
				}
			})
			.finally(() => {
				if (mounted) setIsLoading(false);
			});

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			mounted = false;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [cvId, onClose]);

	if (!cvId) return null;

	const handleSaveText = async () => {
		if (!cvDetail) return;
		if (!editedText.trim()) {
			setError("Extracted text cannot be empty.");
			return;
		}

		setIsSaving(true);
		setError(null);
		setSaveMessage(null);

		try {
			const updated = await updateCVText(cvDetail.id, editedText);
			setCVDetail(updated);
			setEditedText(updated.extracted_text);
			setIsEditing(false);
			setSaveMessage("Extracted text updated & candidate skills re-parsed successfully!");
			if (onSaveSuccess) onSaveSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update extracted text.");
		} finally {
			setIsSaving(false);
		}
	};

	const pdfUrl = `/api/cvs/${cvId}/file`;

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
			<button
				type="button"
				className="fixed inset-0 cursor-default"
				onClick={onClose}
				aria-label="Close CV viewer"
			/>

			<div
				role="dialog"
				aria-modal="true"
				className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
			>
				{/* Modal Header */}
				<div className="p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<h2 className="text-base font-bold text-foreground truncate">
								{cvDetail?.filename ?? "Resume Viewer"}
							</h2>
							{cvDetail && (
								<span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
									{cvDetail.status}
								</span>
							)}
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							{cvDetail
								? `Uploaded ${new Date(cvDetail.created_at).toLocaleString()} • ${cvDetail.skills || "No skills detected"}`
								: "Loading candidate details..."}
						</p>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						{/* View Tabs */}
						<div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 text-xs">
							<button
								type="button"
								onClick={() => setActiveTab("text")}
								className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
									activeTab === "text"
										? "bg-background text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Extracted Text
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("pdf")}
								className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
									activeTab === "pdf"
										? "bg-background text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Original PDF
							</button>
						</div>

						<button
							type="button"
							onClick={onClose}
							className="size-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors text-lg font-bold"
						>
							&times;
						</button>
					</div>
				</div>

				{/* Modal Body */}
				<div className="p-5 overflow-y-auto space-y-4 flex-1">
					{error && (
						<div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
							<strong>Error:</strong> {error}
						</div>
					)}

					{saveMessage && (
						<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
							{saveMessage}
						</div>
					)}

					{isLoading ? (
						<div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
							Loading CV text and document preview...
						</div>
					) : activeTab === "text" ? (
						<div className="space-y-3">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
								<div className="text-xs text-muted-foreground">
									<span>Character count: <strong>{editedText.length}</strong></span> &bull;{" "}
									<span>Lines: <strong>{editedText.split("\n").length}</strong></span>
								</div>

								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsEditing(!isEditing)}
									>
										{isEditing ? "View Formatted Text" : "✏ Edit Extracted Text"}
									</Button>
									{isEditing && (
										<Button
											size="sm"
											onClick={handleSaveText}
											disabled={isSaving || !editedText.trim()}
										>
											{isSaving ? "Saving..." : "Save Changes"}
										</Button>
									)}
								</div>
							</div>

							{isEditing ? (
								<div className="space-y-2">
									<textarea
										rows={16}
										value={editedText}
										onChange={(e) => setEditedText(e.target.value)}
										placeholder="Edit extracted resume text here..."
										className="w-full rounded-lg border border-border bg-background p-3 text-xs font-mono text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
									/>
									<p className="text-[11px] text-muted-foreground">
										Saving changes will re-parse detected candidate skills and update requirement matching in future evaluations.
									</p>
								</div>
							) : (
								<div className="rounded-lg border border-border bg-muted/20 p-4 max-h-[500px] overflow-y-auto">
									<pre className="whitespace-pre-wrap text-xs text-foreground font-sans leading-relaxed">
										{cvDetail?.extracted_text || "No text extracted from this resume."}
									</pre>
								</div>
							)}
						</div>
					) : (
						<div className="space-y-3">
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>PDF Document Preview</span>
								<a
									href={pdfUrl}
									download={cvDetail?.filename || "candidate.pdf"}
									target="_blank"
									rel="noreferrer"
									className="text-primary hover:underline font-semibold"
								>
									Download PDF &rarr;
								</a>
							</div>

							{pdfFailed ? (
								<div className="rounded-lg border border-border bg-muted/30 p-12 text-center text-xs text-muted-foreground space-y-2">
									<p>The PDF preview cannot be embedded directly in your browser or is a seed candidate.</p>
									<a
										href={pdfUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-block rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground text-xs"
									>
										Open PDF in New Tab
									</a>
								</div>
							) : (
								<iframe
									src={pdfUrl}
									title={cvDetail?.filename || "CV PDF"}
									onError={() => setPdfFailed(true)}
									className="w-full h-[550px] rounded-lg border border-border bg-background shadow-xs"
								/>
							)}
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between text-xs">
					<span className="text-muted-foreground text-[11px]">
						ID: {cvDetail?.id}
					</span>
					<Button variant="outline" size="sm" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
