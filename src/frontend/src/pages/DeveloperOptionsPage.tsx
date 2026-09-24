import { useEffect, useState } from "react";
import { useSystemStatus } from "@/components/SystemStatusContext";
import { Button } from "@/components/ui/button";
import { createExtractionTerm, deleteExtractionTerm, getExtractionTerms, updateExtractionTerm, type ExtractionTerm } from "@/lib/api";

const statusLabels = {
	ready: "Ready",
	missing_api_key: "API key missing",
	invalid_api_key: "API key invalid",
	credits_exhausted: "Limit reached",
	rate_limited: "Temporarily rate-limited",
	forbidden: "Access denied",
	provider_unavailable: "OpenRouter unavailable",
	unsupported_provider: "Unsupported provider",
} as const;

function formatAmount(value: number | null | undefined) {
	return value === null || value === undefined ? "Not provided" : `$${value.toFixed(2)}`;
}

export default function DeveloperOptionsPage() {
	const { aiHealth, checkHealth, lastChecked } = useSystemStatus();
	const [terms, setTerms] = useState<ExtractionTerm[]>([]);
	const [newTerm, setNewTerm] = useState("");
	const [newAliases, setNewAliases] = useState("");
	const [newCategory, setNewCategory] = useState("skill");
	const [editingTermId, setEditingTermId] = useState<number | null>(null);
	const [editTerm, setEditTerm] = useState("");
	const [editAliases, setEditAliases] = useState("");
	const [editCategory, setEditCategory] = useState("skill");
	const [termError, setTermError] = useState<string | null>(null);
	const status = aiHealth?.status ?? "provider_unavailable";
	const isReady = status === "ready";
	const isConfigured = status !== "missing_api_key";
	const statusTone = isReady
		? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
		: ["rate_limited", "provider_unavailable"].includes(status)
			? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-200"
			: "border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-200";

	useEffect(() => {
		getExtractionTerms().then(setTerms).catch(() => setTermError("Could not load local extraction terms."));
	}, []);

	const addTerm = async () => {
		if (!newTerm.trim()) return;
		try {
			const created = await createExtractionTerm({ term: newTerm, aliases: newAliases, category: newCategory, enabled: true });
			setTerms((current) => [...current, created].sort((first, second) => first.term.localeCompare(second.term)));
			setNewTerm("");
			setNewAliases("");
			setTermError(null);
		} catch (error) {
			setTermError(error instanceof Error ? error.message : "Could not add extraction term.");
		}
	};

	const removeTerm = async (termId: number) => {
		await deleteExtractionTerm(termId);
		setTerms((current) => current.filter((term) => term.id !== termId));
	};

	const startTermEdit = (term: ExtractionTerm) => {
		setEditingTermId(term.id);
		setEditTerm(term.term);
		setEditAliases(term.aliases);
		setEditCategory(term.category);
	};

	const saveTermEdit = async (termId: number) => {
		const updated = await updateExtractionTerm(termId, { term: editTerm, aliases: editAliases, category: editCategory, enabled: true });
		setTerms((current) => current.map((term) => term.id === termId ? updated : term));
		setEditingTermId(null);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Developer Options</h1>
					<p className="text-sm text-muted-foreground">Review the server-side OpenRouter API key and account allowance.</p>
				</div>
				<Button variant="outline" size="sm" onClick={checkHealth}>Refresh status</Button>
			</div>

			<section className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs">
				<div className={`rounded-lg border p-4 ${statusTone}`}>
				<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wider">OpenRouter API Key</p>
						<h2 className="mt-1 text-lg font-bold">{statusLabels[status]}</h2>
						<p className="mt-1 text-sm">{aiHealth?.message ?? "Unable to check OpenRouter configuration."}</p>
					</div>
					<span className="inline-flex w-fit items-center gap-2 rounded-full border border-current/20 px-2.5 py-1 text-xs font-semibold">
						<span className={`size-2 rounded-full ${isReady ? "bg-emerald-500" : ["rate_limited", "provider_unavailable"].includes(status) ? "bg-amber-500" : "bg-rose-500"}`} />
						{isReady ? "Working" : "Needs attention"}
					</span>
				</div>
				</div>
				<div className="border-b border-border/60 pb-3">
					<h2 className="text-base font-bold text-foreground">Key and usage details</h2>
					<p className="mt-1 text-xs text-muted-foreground">The secret key value is never displayed or sent to the browser.</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Detail label="Key configured" value={isConfigured ? "Yes" : "No"} />
					<Detail label="Key active" value={aiHealth?.is_active === true ? "Yes" : aiHealth?.is_active === false ? "No" : "Not provided"} />
					<Detail label="Key label" value={aiHealth?.key_label ?? "Not provided"} />
					<Detail label="Usage" value={formatAmount(aiHealth?.usage)} />
					<Detail label="Key limit" value={formatAmount(aiHealth?.limit)} />
					<Detail label="Remaining" value={formatAmount(aiHealth?.limit_remaining)} />
				</div>
				<div className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
					<p>Model: <span className="font-medium text-foreground">{aiHealth?.model ?? "Not available"}</span></p>
					<p className="mt-1">Limit reset: <span className="font-medium text-foreground">{aiHealth?.limit_reset ?? "Not provided"}</span></p>
					{lastChecked && <p className="mt-1">Last checked: {lastChecked.toLocaleString()}</p>}
				</div>
				<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
					<p className="font-semibold">Change the OpenRouter API key</p>
					<p className="mt-1 text-xs leading-5">
						Update <code className="font-semibold">AI_API_KEY</code> in the backend environment, then restart CV-Rank. This page intentionally does not accept or store secret keys because the application has no administrator authentication layer.
					</p>
				</div>
			</section>

			<section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
				<div className="border-b border-border/60 pb-3">
					<h2 className="text-base font-bold text-foreground">Local extraction dictionary</h2>
					<p className="mt-1 text-xs text-muted-foreground">These optional terms improve the basic metadata preview only. AI evaluation remains position-specific.</p>
				</div>
				<div className="grid gap-2 sm:grid-cols-[1fr_1fr_10rem_auto]">
					<input value={newTerm} onChange={(event) => setNewTerm(event.target.value)} placeholder="Term" className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
					<input value={newAliases} onChange={(event) => setNewAliases(event.target.value)} placeholder="Aliases, comma-separated" className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
					<input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Category" className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
					<Button size="sm" onClick={addTerm}>Add term</Button>
				</div>
				{termError && <p className="text-xs text-rose-700 dark:text-rose-300">{termError}</p>}
				<div className="divide-y divide-border/60 rounded-lg border border-border">
					{terms.map((term) => editingTermId === term.id ? (
						<div key={term.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_1fr_10rem_auto_auto]">
							<input value={editTerm} onChange={(event) => setEditTerm(event.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
							<input value={editAliases} onChange={(event) => setEditAliases(event.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
							<input value={editCategory} onChange={(event) => setEditCategory(event.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
							<Button size="sm" onClick={() => saveTermEdit(term.id)}>Save</Button>
							<button type="button" onClick={() => setEditingTermId(null)} className="text-xs font-semibold text-muted-foreground">Cancel</button>
						</div>
					) : (
						<div key={term.id} className="flex items-center justify-between gap-3 p-3 text-xs">
							<div className="min-w-0"><span className="font-semibold text-foreground">{term.term}</span><span className="ml-2 text-muted-foreground">{term.category}{term.aliases ? ` · ${term.aliases}` : ""}</span></div>
							<div className="flex shrink-0 gap-3"><button type="button" onClick={() => startTermEdit(term)} className="font-semibold text-muted-foreground hover:text-foreground">Edit</button><button type="button" onClick={() => removeTerm(term.id)} className="font-semibold text-muted-foreground hover:text-rose-600">Remove</button></div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-border/70 bg-background p-3">
			<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
			<p className="mt-1 truncate text-sm font-semibold text-foreground" title={value}>{value}</p>
		</div>
	);
}