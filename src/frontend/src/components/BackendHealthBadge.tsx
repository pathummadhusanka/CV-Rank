import { useState } from "react";
import { useSystemStatus } from "@/components/SystemStatusContext";

export function BackendHealthBadge() {
	const [isOpen, setIsOpen] = useState(false);
	const { health, aiHealth, backendStatus, lastChecked, isStarting, hasInitialCheckCompleted, isChecking, checkHealth } = useSystemStatus();

	const isBackendChecking = backendStatus === "checking";
	const hasBackendIssue = backendStatus === "offline";
	const hasAIConfigurationIssue = aiHealth?.status && [
		"missing_api_key",
		"invalid_api_key",
		"credits_exhausted",
		"forbidden",
		"unsupported_provider",
	].includes(aiHealth.status);
	const hasAITemporaryIssue = aiHealth?.status && ["rate_limited", "provider_unavailable"].includes(aiHealth.status);
	const hasAIHealthFailure = backendStatus === "online" && aiHealth === null;
	const isSettingUp = isStarting && !hasInitialCheckCompleted;
	const overallStatus = isStarting || isChecking || isBackendChecking ? "checking" : hasAITemporaryIssue || hasAIHealthFailure ? "warning" : hasBackendIssue || hasAIConfigurationIssue ? "error" : "ready";
	const statusColor = {
		ready: "bg-emerald-500",
		checking: "bg-slate-400",
		warning: "bg-amber-500",
		error: "bg-rose-500",
	}[overallStatus];
	const statusLabel = {
		ready: "System ready",
		checking: isSettingUp ? "System is setting up" : "Checking system",
		warning: "System warning",
		error: "System issue",
	}[overallStatus];

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((open) => !open)}
				className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/60"
				aria-expanded={isOpen}
				aria-haspopup="menu"
			>
				<span className={`size-2 rounded-full ${statusColor}`} />
				<span className="text-foreground">{statusLabel}</span>
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-background p-3 text-xs shadow-lg" role="menu">
					<div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
						<strong className="text-foreground">System status</strong>
						<button
							type="button"
							onClick={checkHealth}
							className="font-semibold text-primary hover:underline"
						>
							Refresh
						</button>
					</div>
					<div className="space-y-3">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="font-semibold text-foreground">Backend API</p>
								<p className="text-muted-foreground">
									{backendStatus === "online"
										? `${health?.service ?? "API"} is connected (v${health?.version ?? "unknown"}).`
										: "The application server cannot be reached."}
								</p>
							</div>
							<span className={`mt-1 size-2 shrink-0 rounded-full ${backendStatus === "online" ? "bg-emerald-500" : "bg-rose-500"}`} />
						</div>
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="font-semibold text-foreground">OpenRouter AI</p>
								<p className="text-muted-foreground">
									{aiHealth?.message ?? "Unable to check OpenRouter configuration."}
								</p>
								{aiHealth?.model && <p className="mt-1 text-[11px] text-muted-foreground">Model: {aiHealth.model}</p>}
							</div>
							<span className={`mt-1 size-2 shrink-0 rounded-full ${aiHealth?.status === "ready" ? "bg-emerald-500" : hasAITemporaryIssue || hasAIHealthFailure ? "bg-amber-500" : "bg-rose-500"}`} />
						</div>
					</div>
					{lastChecked && <p className="mt-3 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">Last checked {lastChecked.toLocaleTimeString()}</p>}
				</div>
			)}
		</div>
	);
}
