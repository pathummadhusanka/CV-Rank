import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { CreateBatchModal } from "@/components/CreateBatchModal";
import { CVUploader } from "@/components/CVUploader";
import { deleteCV, getCVs, type CVSummary } from "@/lib/api";
import {
	clearAllStoredBatches,
	deleteStoredBatch,
	getStoredBatches,
	sanitizeStoredBatches,
	saveStoredBatch,
	type CVBatch,
} from "@/lib/storage";

function DocumentIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z"
			/>
		</svg>
	);
}

function FolderIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
			/>
		</svg>
	);
}

function SearchIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
			/>
		</svg>
	);
}

function DotsVerticalIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
			/>
		</svg>
	);
}

function ChevronLeftIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
		</svg>
	);
}

function ChevronRightIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
		</svg>
	);
}

type TabMode = "resumes" | "batches" | "all";
type SortOption = "newest" | "oldest" | "name";

export default function CVLibraryPage() {
	const navigate = useNavigate();
	const [cvs, setCVs] = useState<CVSummary[]>([]);
	const [batches, setBatches] = useState<CVBatch[]>(() => getStoredBatches());
	const [selectedCVIds, setSelectedCVIds] = useState<string[]>([]);
	const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);

	// Layout & Filter states
	const [activeTab, setActiveTab] = useState<TabMode>("resumes");
	const [searchQuery, setSearchQuery] = useState("");
	const [batchSearchQuery, setBatchSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("newest");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(6);
	const [activeMenuCVId, setActiveMenuCVId] = useState<string | null>(null);
	const [expandedBatchIds, setExpandedBatchIds] = useState<Record<string, boolean>>({});

	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		void refreshCVs();
	}, []);

	// Close action menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setActiveMenuCVId(null);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const refreshCVs = async () => {
		try {
			const fetched = await getCVs();
			setCVs(fetched);
			setBatches(sanitizeStoredBatches(fetched.map((cv) => cv.id)));
		} catch {
			setCVs([]);
			setBatches(clearAllStoredBatches());
		}
	};

	const handleClearAllBatches = () => {
		const cleared = clearAllStoredBatches();
		setBatches(cleared);
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

	const handleEvaluateCVs = (cvIds: string[]) => {
		if (cvIds.length === 1) {
			navigate(`/evaluations?cvId=${cvIds[0]}`);
		} else {
			// Create a temporary batch or evaluate first
			navigate(`/evaluations?cvId=${cvIds[0]}`);
		}
	};

	const toggleBatchExpand = (batchId: string) => {
		setExpandedBatchIds((prev) => ({
			...prev,
			[batchId]: !prev[batchId],
		}));
	};

	// Filtering & Sorting Individual CVs
	const filteredCVs = cvs.filter((cv) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		return (
			cv.filename.toLowerCase().includes(q) ||
			(cv.skills && cv.skills.toLowerCase().includes(q))
		);
	});

	const sortedCVs = [...filteredCVs].sort((a, b) => {
		if (sortBy === "newest") {
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		}
		if (sortBy === "oldest") {
			return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
		}
		if (sortBy === "name") {
			return a.filename.localeCompare(b.filename);
		}
		return 0;
	});

	// Pagination Math
	const totalItems = sortedCVs.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const startIndex = (safePage - 1) * pageSize;
	const paginatedCVs = sortedCVs.slice(startIndex, startIndex + pageSize);

	// Filtering Batches
	const filteredBatches = batches.filter((batch) => {
		if (!batchSearchQuery.trim()) return true;
		const q = batchSearchQuery.toLowerCase();
		return (
			batch.name.toLowerCase().includes(q) ||
			(batch.description && batch.description.toLowerCase().includes(q))
		);
	});

	// Selection helpers
	const isPageSelected =
		paginatedCVs.length > 0 && paginatedCVs.every((cv) => selectedCVIds.includes(cv.id));

	const toggleSelectPage = () => {
		const pageIds = paginatedCVs.map((c) => c.id);
		if (isPageSelected) {
			setSelectedCVIds((prev) => prev.filter((id) => !pageIds.includes(id)));
		} else {
			setSelectedCVIds((prev) => Array.from(new Set([...prev, ...pageIds])));
		}
	};

	const toggleSelectAllFiltered = () => {
		const allFilteredIds = sortedCVs.map((c) => c.id);
		if (selectedCVIds.length === allFilteredIds.length) {
			setSelectedCVIds([]);
		} else {
			setSelectedCVIds(allFilteredIds);
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">CV Library &amp; Batches</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Manage uploaded candidate resumes, organize custom batches, and evaluate candidates.
					</p>
				</div>
				{selectedCVIds.length > 0 && (
					<div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2 shrink-0">
						<span className="text-xs font-semibold text-primary px-2">{selectedCVIds.length} Selected</span>
						<Button size="sm" onClick={() => setShowCreateBatchModal(true)}>
							+ Create Batch
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleEvaluateCVs(selectedCVIds)}
						>
							Evaluate in Workspace &rarr;
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setPendingDeleteIds(selectedCVIds)}
						>
							Delete Selected
						</Button>
						<Button variant="ghost" size="sm" onClick={() => setSelectedCVIds([])}>
							Clear
						</Button>
					</div>
				)}
			</div>

			{/* Section Tabs & View Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
				<div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-1 text-xs">
					<button
						type="button"
						onClick={() => setActiveTab("resumes")}
						className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer ${
							activeTab === "resumes"
								? "bg-background text-foreground shadow-xs font-semibold"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<DocumentIcon className="size-3.5" />
						Individual Resumes ({cvs.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("batches")}
						className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer ${
							activeTab === "batches"
								? "bg-background text-foreground shadow-xs font-semibold"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<FolderIcon className="size-3.5" />
						Saved Batches ({batches.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("all")}
						className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer ${
							activeTab === "all"
								? "bg-background text-foreground shadow-xs font-semibold"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						All-in-One View
					</button>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* SECTION 1: SAVED CV BATCHES */}
			{/* ========================================================================= */}
			{(activeTab === "batches" || activeTab === "all") && (
				<section className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-primary/10 p-2.5 text-primary">
								<FolderIcon className="size-5" />
							</div>
							<div>
								<h2 className="text-base font-bold text-foreground">Saved CV Batches ({batches.length})</h2>
								<p className="text-xs text-muted-foreground">Pre-grouped candidate pools for fast evaluations.</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<div className="relative flex-1 sm:w-60">
								<SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
								<input
									type="text"
									placeholder="Search batches..."
									value={batchSearchQuery}
									onChange={(e) => setBatchSearchQuery(e.target.value)}
									className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
								/>
							</div>
							{batches.length > 0 && (
								<Button variant="outline" size="sm" onClick={handleClearAllBatches}>
									Clear All Batches
								</Button>
							)}
						</div>
					</div>

					{filteredBatches.length === 0 ? (
						<div className="rounded-xl border border-border bg-card/60 p-8 text-center text-xs text-muted-foreground">
							{batches.length === 0
								? "No CV batches have been saved yet. Select candidate resumes below and click '+ Create Batch'."
								: "No batches match your search query."}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{filteredBatches.map((batch) => {
								const includedCVs = cvs.filter((cv) => batch.cvIds.includes(cv.id));
								const isExpanded = !!expandedBatchIds[batch.id];
								const displayedCVs = isExpanded ? includedCVs : includedCVs.slice(0, 4);

								return (
									<div
										key={batch.id}
										className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-border/80 transition-all"
									>
										<div className="space-y-3">
											<div className="flex items-start justify-between gap-2">
												<div>
													<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
														<FolderIcon className="size-4 text-primary shrink-0" />
														<span>{batch.name}</span>
													</h3>
													{batch.description && (
														<p className="text-xs text-muted-foreground mt-0.5">{batch.description}</p>
													)}
												</div>
												<span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary shrink-0">
													{batch.cvIds.length} Candidate{batch.cvIds.length === 1 ? "" : "s"}
												</span>
											</div>

											{/* Candidate Badges */}
											<div className="space-y-1.5">
												<p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
													Included Candidates
												</p>
												<div className="flex flex-wrap gap-1.5">
													{includedCVs.length > 0 ? (
														displayedCVs.map((cv) => (
															<span
																key={cv.id}
																className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground font-medium truncate max-w-[200px]"
															>
																<DocumentIcon className="size-3 text-muted-foreground shrink-0" />
																<span className="truncate">{cv.filename}</span>
															</span>
														))
													) : (
														<span className="text-[11px] text-muted-foreground italic">
															Contains {batch.cvIds.length} candidate reference(s)
														</span>
													)}

													{includedCVs.length > 4 && (
														<button
															type="button"
															onClick={() => toggleBatchExpand(batch.id)}
															className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
														>
															{isExpanded
																? "Show less"
																: `+${includedCVs.length - 4} more`}
														</button>
													)}
												</div>
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
													Evaluate Batch &rarr;
												</Button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</section>
			)}

			{/* ========================================================================= */}
			{/* SECTION 2: INDIVIDUAL RESUMES (WITH PAGINATION) */}
			{/* ========================================================================= */}
			{(activeTab === "resumes" || activeTab === "all") && (
				<section className="space-y-4">
					<div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-400">
									<DocumentIcon className="size-5" />
								</div>
								<div>
									<h2 className="text-base font-bold text-foreground">
										Individual Resumes ({sortedCVs.length})
									</h2>
									<p className="text-xs text-muted-foreground">
										Browse, select, search, and manage candidate CV files.
									</p>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								{/* Search Input */}
								<div className="relative flex-1 sm:w-64">
									<SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
									<input
										type="text"
										placeholder="Search by filename or skills..."
										value={searchQuery}
										onChange={(e) => {
											setSearchQuery(e.target.value);
											setCurrentPage(1);
										}}
										className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
									/>
									{searchQuery && (
										<button
											type="button"
											onClick={() => setSearchQuery("")}
											className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
										>
											&times;
										</button>
									)}
								</div>

								{/* Sort Dropdown */}
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value as SortOption)}
									className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
								>
									<option value="newest">Sort: Newest First</option>
									<option value="oldest">Sort: Oldest First</option>
									<option value="name">Sort: Filename (A-Z)</option>
								</select>

								{/* Page Size Selector */}
								<select
									value={pageSize}
									onChange={(e) => {
										setPageSize(Number(e.target.value));
										setCurrentPage(1);
									}}
									className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
								>
									<option value={6}>6 per page</option>
									<option value={12}>12 per page</option>
									<option value={24}>24 per page</option>
								</select>
							</div>
						</div>

						{/* Selection Bar */}
						{sortedCVs.length > 0 && (
							<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-1 pt-1">
								<div className="flex items-center gap-3">
									<label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
										<input
											type="checkbox"
											checked={isPageSelected}
											onChange={toggleSelectPage}
											className="rounded border-border text-primary focus:ring-primary"
										/>
										<span>Select Current Page ({paginatedCVs.length})</span>
									</label>

									<button
										type="button"
										onClick={toggleSelectAllFiltered}
										className="text-primary hover:underline font-medium cursor-pointer"
									>
										{selectedCVIds.length === sortedCVs.length
											? "Deselect All"
											: `Select All Filtered (${sortedCVs.length})`}
									</button>
								</div>

								<span className="text-xs">
									Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems} Resumes
								</span>
							</div>
						)}
					</div>

					{/* CV Grid */}
					{paginatedCVs.length === 0 ? (
						<div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
							{cvs.length === 0
								? "No CVs uploaded yet. Use the upload area below to add candidate resumes."
								: "No resumes match your search query."}
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{paginatedCVs.map((cv) => {
								const isSelected = selectedCVIds.includes(cv.id);
								const isMenuOpen = activeMenuCVId === cv.id;
								const skillsList = cv.skills
									? cv.skills.split(",").map((s) => s.trim()).filter(Boolean)
									: [];

								return (
									<div
										key={cv.id}
										className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
											isSelected
												? "border-primary/60 bg-primary/5 shadow-xs"
												: "border-border bg-card hover:border-border/80"
										}`}
									>
										<div className="space-y-2.5">
											<div className="flex items-start justify-between gap-2">
												<label className="flex items-start gap-2.5 min-w-0 cursor-pointer flex-1">
													<input
														type="checkbox"
														checked={isSelected}
														onChange={(e) =>
															setSelectedCVIds((currentIds) =>
																e.target.checked
																	? [...currentIds, cv.id]
																	: currentIds.filter((id) => id !== cv.id),
															)
														}
														className="mt-0.5 shrink-0 rounded border-border text-primary focus:ring-primary"
													/>
													<div className="min-w-0">
														<h3 className="truncate text-sm font-bold text-foreground" title={cv.filename}>
															{cv.filename}
														</h3>
														<p className="text-[11px] text-muted-foreground mt-0.5">
															{new Date(cv.created_at).toLocaleDateString()} &bull; {cv.status}
														</p>
													</div>
												</label>

												{/* Dropdown Menu Toggle */}
												<div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
													<button
														type="button"
														onClick={() => setActiveMenuCVId(isMenuOpen ? null : cv.id)}
														className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
														title="Candidate options"
													>
														<DotsVerticalIcon className="size-4" />
													</button>

													{/* Action Dropdown Menu */}
													{isMenuOpen && (
														<div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-lg border border-border bg-popover p-1 shadow-md text-xs space-y-0.5">
															<button
																type="button"
																onClick={() => {
																	setActiveMenuCVId(null);
																	handleEvaluateCVs([cv.id]);
																}}
																className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-accent text-popover-foreground transition-colors font-medium flex items-center justify-between cursor-pointer"
															>
																<span>Evaluate Candidate</span>
																<span className="text-[10px] text-muted-foreground">&rarr;</span>
															</button>
															<button
																type="button"
																onClick={() => {
																	setActiveMenuCVId(null);
																	setSelectedCVIds([cv.id]);
																	setShowCreateBatchModal(true);
																}}
																className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-accent text-popover-foreground transition-colors font-medium cursor-pointer"
															>
																Create Batch from CV
															</button>
															<div className="border-t border-border/60 my-0.5" />
															<button
																type="button"
																onClick={() => {
																	setActiveMenuCVId(null);
																	setPendingDeleteIds([cv.id]);
																}}
																className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors font-medium cursor-pointer"
															>
																Delete Candidate
															</button>
														</div>
													)}
												</div>
											</div>

											{/* Detected Skills Badges */}
											<div className="flex flex-wrap gap-1 pt-1">
												{skillsList.length > 0 ? (
													skillsList.slice(0, 5).map((skill) => (
														<span
															key={skill}
															className="rounded bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
														>
															{skill}
														</span>
													))
												) : (
													<span className="text-[11px] text-muted-foreground italic">
														No detected skills
													</span>
												)}
												{skillsList.length > 5 && (
													<span className="text-[10px] text-muted-foreground self-center">
														+{skillsList.length - 5}
													</span>
												)}
											</div>
										</div>

										<div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
											<span className="text-[10px]">
												{cv.experience_years !== null ? `${cv.experience_years} yrs exp` : "No exp specified"}
											</span>
											<button
												type="button"
												onClick={() => handleEvaluateCVs([cv.id])}
												className="text-xs font-semibold text-primary hover:underline cursor-pointer"
											>
												Evaluate &rarr;
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs text-xs">
							<span className="text-muted-foreground">
								Page {safePage} of {totalPages} ({totalItems} total candidates)
							</span>

							<div className="flex items-center gap-1.5">
								<Button
									variant="outline"
									size="sm"
									disabled={safePage <= 1}
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									className="gap-1 cursor-pointer"
								>
									<ChevronLeftIcon className="size-3.5" />
									Previous
								</Button>

								<div className="flex items-center gap-1 px-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
										<button
											key={pageNum}
											type="button"
											onClick={() => setCurrentPage(pageNum)}
											className={`size-7 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
												pageNum === safePage
													? "bg-primary text-primary-foreground shadow-xs"
													: "text-muted-foreground hover:bg-muted hover:text-foreground"
											}`}
										>
											{pageNum}
										</button>
									))}
								</div>

								<Button
									variant="outline"
									size="sm"
									disabled={safePage >= totalPages}
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									className="gap-1 cursor-pointer"
								>
									Next
									<ChevronRightIcon className="size-3.5" />
								</Button>
							</div>
						</div>
					)}
				</section>
			)}

			{/* ========================================================================= */}
			{/* MODALS & UPLOADER */}
			{/* ========================================================================= */}
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

			<section className="pt-2">
				<CVUploader onCandidatesChange={() => { void refreshCVs(); }} />
			</section>
		</div>
	);
}