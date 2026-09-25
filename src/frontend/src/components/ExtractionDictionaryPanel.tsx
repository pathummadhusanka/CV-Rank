import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createExtractionTerm, deleteExtractionTerm, getExtractionTerms, updateExtractionTerm, type ExtractionTerm } from "@/lib/api";

export function ExtractionDictionaryPanel() {
	const [terms, setTerms] = useState<ExtractionTerm[]>([]);
	const [newTerm, setNewTerm] = useState("");
	const [newAliases, setNewAliases] = useState("");
	const [newCategory, setNewCategory] = useState("skill");
	const [editingTermId, setEditingTermId] = useState<number | null>(null);
	const [editTerm, setEditTerm] = useState("");
	const [editAliases, setEditAliases] = useState("");
	const [editCategory, setEditCategory] = useState("skill");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getExtractionTerms().then(setTerms).catch(() => setError("Could not load local extraction terms."));
	}, []);

	const addTerm = async () => {
		if (!newTerm.trim()) return;
		try {
			const created = await createExtractionTerm({ term: newTerm, aliases: newAliases, category: newCategory, enabled: true });
			setTerms((current) => [...current, created].sort((first, second) => first.term.localeCompare(second.term)));
			setNewTerm("");
			setNewAliases("");
			setError(null);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Could not add extraction term.");
		}
	};

	const startEdit = (term: ExtractionTerm) => {
		setEditingTermId(term.id);
		setEditTerm(term.term);
		setEditAliases(term.aliases);
		setEditCategory(term.category);
	};

	const saveEdit = async (termId: number) => {
		try {
			const updated = await updateExtractionTerm(termId, { term: editTerm, aliases: editAliases, category: editCategory, enabled: true });
			setTerms((current) => current.map((term) => term.id === termId ? updated : term));
			setEditingTermId(null);
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Could not update extraction term.");
		}
	};

	const removeTerm = async (termId: number) => {
		try {
			await deleteExtractionTerm(termId);
			setTerms((current) => current.filter((term) => term.id !== termId));
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Could not remove extraction term.");
		}
	};

	return (
		<section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
			<div className="border-b border-border/60 pb-3">
				<h2 className="text-base font-bold text-foreground">Local extraction dictionary</h2>
				<p className="mt-1 text-xs text-muted-foreground">These terms improve the basic metadata preview only. AI evaluation remains position-specific.</p>
			</div>
			<div className="grid gap-2 sm:grid-cols-[1fr_1fr_10rem_auto]">
				<input value={newTerm} onChange={(event) => setNewTerm(event.target.value)} placeholder="Term" className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
				<input value={newAliases} onChange={(event) => setNewAliases(event.target.value)} placeholder="Aliases, comma-separated" className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
				<input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Category" className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
				<Button size="sm" onClick={addTerm}>Add term</Button>
			</div>
			{error && <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
			<div className="divide-y divide-border/60 rounded-lg border border-border">
				{terms.map((term) => editingTermId === term.id ? (
					<div key={term.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_1fr_10rem_auto_auto]">
						<input value={editTerm} onChange={(event) => setEditTerm(event.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
						<input value={editAliases} onChange={(event) => setEditAliases(event.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
						<input value={editCategory} onChange={(event) => setEditCategory(event.target.value)} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs" />
						<Button size="sm" onClick={() => saveEdit(term.id)}>Save</Button>
						<button type="button" onClick={() => setEditingTermId(null)} className="text-xs font-semibold text-muted-foreground">Cancel</button>
					</div>
				) : (
					<div key={term.id} className="flex items-center justify-between gap-3 p-3 text-xs">
						<div className="min-w-0"><span className="font-semibold text-foreground">{term.term}</span><span className="ml-2 text-muted-foreground">{term.category}{term.aliases ? ` · ${term.aliases}` : ""}</span></div>
						<div className="flex shrink-0 gap-3"><button type="button" onClick={() => startEdit(term)} className="font-semibold text-muted-foreground hover:text-foreground">Edit</button><button type="button" onClick={() => removeTerm(term.id)} className="font-semibold text-muted-foreground hover:text-rose-600">Remove</button></div>
					</div>
				))}
			</div>
		</section>
	);
}