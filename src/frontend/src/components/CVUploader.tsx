import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { uploadCV } from "@/lib/api";

export interface UploadedCandidate {
	id: string;
	filename: string;
	size: number;
}

interface FileUploadItem {
	localId: string;
	file: File;
	status: "queued" | "uploading" | "success" | "error";
	error?: string;
	cvId?: string;
}

interface CVUploaderProps {
	onCandidatesChange: (candidates: UploadedCandidate[]) => void;
	disabled?: boolean;
	hideHeader?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function CVUploader({ onCandidatesChange, disabled, hideHeader = false }: CVUploaderProps) {
	const [files, setFiles] = useState<FileUploadItem[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const formatSize = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const uploadQueue = async (itemsToUpload: FileUploadItem[]) => {
		for (const item of itemsToUpload) {
			// Update status to uploading
			setFiles((prev) =>
				prev.map((f) =>
					f.localId === item.localId ? { ...f, status: "uploading", error: undefined } : f,
				),
			);

			try {
				const res = await uploadCV(item.file);
				setFiles((prev) => {
					const updated = prev.map((f) =>
						f.localId === item.localId
							? { ...f, status: "success" as const, cvId: res.id }
							: f,
					);
					// Notify parent of successful candidates
					const successfulCandidates: UploadedCandidate[] = updated
						.filter((f) => f.status === "success" && f.cvId)
						.map((f) => ({
							id: f.cvId!,
							filename: f.file.name,
							size: f.file.size,
						}));
					onCandidatesChange(successfulCandidates);
					return updated;
				});
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "Failed to parse and upload CV";
				setFiles((prev) =>
					prev.map((f) =>
						f.localId === item.localId
							? { ...f, status: "error" as const, error: errorMsg }
							: f,
					),
				);
			}
		}
	};

	const handleAddFiles = (incomingFiles: FileList | File[]) => {
		setGlobalError(null);
		const newItems: FileUploadItem[] = [];
		const rejectedNames: string[] = [];

		Array.from(incomingFiles).forEach((file) => {
			if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
				rejectedNames.push(`${file.name} (not a PDF)`);
				return;
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				rejectedNames.push(`${file.name} (exceeds 5MB)`);
				return;
			}

			newItems.push({
				localId: `${file.name}-${Date.now()}-${Math.random()}`,
				file,
				status: "queued",
			});
		});

		if (rejectedNames.length > 0) {
			setGlobalError(`Skipped invalid files: ${rejectedNames.join(", ")}`);
		}

		if (newItems.length > 0) {
			setFiles((prev) => [...prev, ...newItems]);
			// Automatically trigger upload for the newly added batch
			uploadQueue(newItems);
		}
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!disabled) setIsDragging(true);
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		if (disabled) return;
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleAddFiles(e.dataTransfer.files);
		}
	};

	const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			handleAddFiles(e.target.files);
			e.target.value = "";
		}
	};

	const handleRemoveFile = (localId: string) => {
		setFiles((prev) => {
			const updated = prev.filter((f) => f.localId !== localId);
			const successfulCandidates: UploadedCandidate[] = updated
				.filter((f) => f.status === "success" && f.cvId)
				.map((f) => ({
					id: f.cvId!,
					filename: f.file.name,
					size: f.file.size,
				}));
			onCandidatesChange(successfulCandidates);
			return updated;
		});
	};

	const handleClearAll = () => {
		setFiles([]);
		onCandidatesChange([]);
	};

	const successfulCount = files.filter((f) => f.status === "success").length;
	const isUploadingAny = files.some((f) => f.status === "uploading");

	return (
		<div className={hideHeader ? "space-y-4" : "rounded-xl border border-border bg-card p-6 shadow-xs space-y-4"}>
			{!hideHeader && (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
					<div>
						<h3 className="text-base font-bold text-foreground tracking-tight">
							Step 2: Upload Candidate CVs (PDF)
						</h3>
						<p className="text-xs text-muted-foreground mt-0.5">
							Upload one or multiple PDF resumes. The backend extracts text and detects qualifications.
						</p>
					</div>

					{files.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClearAll}
							disabled={disabled || isUploadingAny}
						>
							Clear All
						</Button>
					)}
				</div>
			)}

			{globalError && (
				<div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between">
					<span>{globalError}</span>
					<button
						type="button"
						onClick={() => setGlobalError(null)}
						className="font-bold hover:opacity-75 cursor-pointer ml-2"
					>
						&times;
					</button>
				</div>
			)}

			{/* Dropzone */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => !disabled && fileInputRef.current?.click()}
				className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
					isDragging
						? "border-primary bg-primary/5 scale-[0.99]"
						: "border-border/80 hover:border-primary/50 hover:bg-muted/40"
				} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept=".pdf,application/pdf"
					onChange={handleFileSelect}
					className="hidden"
				/>

				<div className="size-12 rounded-full bg-secondary flex items-center justify-center mb-3 text-secondary-foreground font-bold">
					<svg
						className="size-6 text-foreground"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/>
					</svg>
				</div>

				<h4 className="text-sm font-semibold text-foreground">
					Drag &amp; drop PDF resumes here, or <span className="text-primary underline">browse</span>
				</h4>
				<p className="text-xs text-muted-foreground mt-1">
					Supports multiple PDF files up to 5 MB each.
				</p>
			</div>

			{/* File List / Queue */}
			{files.length > 0 && (
				<div className="space-y-2 pt-2">
					<div className="flex items-center justify-between text-xs font-semibold text-foreground">
						<span>
							Uploaded Files ({successfulCount}/{files.length} ready)
						</span>
						{isUploadingAny && (
							<span className="text-primary text-[11px] animate-pulse">
								Processing files...
							</span>
						)}
					</div>

					<div className="divide-y divide-border/60 rounded-lg border border-border/80 overflow-hidden bg-background">
						{files.map((item) => (
							<div
								key={item.localId}
								className="flex items-center justify-between px-3.5 py-2.5 text-xs gap-3"
							>
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="size-7 rounded bg-muted flex items-center justify-center shrink-0 font-bold text-[10px] text-muted-foreground uppercase">
										PDF
									</div>
									<div className="min-w-0">
										<p className="font-medium text-foreground truncate max-w-xs sm:max-w-md">
											{item.file.name}
										</p>
										<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
											<span>{formatSize(item.file.size)}</span>
											{item.cvId && (
												<>
													<span>&bull;</span>
													<span className="font-mono text-[10px]">
														ID: {item.cvId.slice(0, 8)}...
													</span>
												</>
											)}
										</div>
									</div>
								</div>

								<div className="flex items-center gap-3 shrink-0">
									{item.status === "queued" && (
										<span className="text-muted-foreground font-medium">Queued</span>
									)}
									{item.status === "uploading" && (
										<span className="inline-flex items-center gap-1.5 text-primary font-medium">
											<span className="size-1.5 rounded-full bg-primary animate-ping" />
											Extracting text...
										</span>
									)}
									{item.status === "success" && (
										<span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
											✓ Processed
										</span>
									)}
									{item.status === "error" && (
										<span
											className="inline-flex items-center gap-1 text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20"
											title={item.error}
										>
											✕ {item.error || "Failed"}
										</span>
									)}

									<button
										type="button"
										onClick={() => handleRemoveFile(item.localId)}
										className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer"
										title="Remove file"
									>
										&times;
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
