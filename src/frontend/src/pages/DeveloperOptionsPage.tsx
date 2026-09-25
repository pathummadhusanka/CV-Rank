import { useSystemStatus } from "@/components/SystemStatusContext";
import { Button } from "@/components/ui/button";

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
	const { aiHealth, checkHealth, lastChecked, isChecking } = useSystemStatus();
	const status = aiHealth?.status ?? "provider_unavailable";
	const isReady = status === "ready";
	const isConfigured = status !== "missing_api_key";
	const statusTone = isReady
		? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
		: ["rate_limited", "provider_unavailable"].includes(status)
			? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-200"
			: "border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-200";


	return (
		<div className="space-y-6">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Developer Options</h1>
					<p className="text-sm text-muted-foreground">Review the server-side OpenRouter API key and account allowance.</p>
				</div>
				<Button variant="outline" size="sm" onClick={checkHealth} disabled={isChecking}>
					{isChecking ? "Checking..." : "Refresh status"}
				</Button>
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
				<div>
					<h2 className="text-base font-bold text-foreground">Local Browser Storage &amp; Batches Reset</h2>
					<p className="mt-1 text-xs text-muted-foreground">
						Clear saved browser local storage (CV Batches &amp; project history) after a fresh backend database run.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						localStorage.clear();
						window.location.reload();
					}}
				>
					Clear All Local Browser Batches &amp; Storage
				</Button>
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