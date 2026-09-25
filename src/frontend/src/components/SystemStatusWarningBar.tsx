import { useSystemStatus } from "@/components/SystemStatusContext";

type StatusItem = {
	label: string;
	severity: "warning" | "error";
	hint?: string;
};

export function SystemStatusWarningBar() {
	const { health, aiHealth, checked, isStarting, hasInitialCheckCompleted, isChecking } = useSystemStatus();
	const isSettingUp = isStarting && !hasInitialCheckCompleted;

	if (isSettingUp || isStarting || isChecking) {
		return (
			<div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground" role="status">
				<div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-center">
					<p><strong className="text-foreground">{isSettingUp ? "System is setting up." : "Checking system services."}</strong> Please wait a moment...</p>
				</div>
			</div>
		);
	}

	if (!checked) return null;

	const issues: StatusItem[] = [];
	if (!health || health.status !== "ok") {
		issues.push({ label: "System service is unavailable", severity: "error" });
	}
	if (!aiHealth) {
		issues.push({
			label: "OpenRouter status could not be checked",
			severity: "warning",
			hint: "Replace your new API KEY using env file",
		});
	} else if (aiHealth.status !== "ready") {
		const configurationIssue = [
			"missing_api_key",
			"invalid_api_key",
			"credits_exhausted",
			"forbidden",
			"unsupported_provider",
		].includes(aiHealth.status);
		issues.push({
			label: aiHealth.message,
			severity: configurationIssue ? "error" : "warning",
			hint: "Replace your new API KEY using env file",
		});
	}

	if (issues.length === 0) return null;

	const hasError = issues.some((issue) => issue.severity === "error");
	const extraCount = issues.length - 1;
	const extraLabel = extraCount === 1 ? "issue" : "issues";

	return (
		<div
			className={`border-b px-4 py-2 text-xs ${
				hasError
					? "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
					: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
			}`}
			role="alert"
		>
			<div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-center">
				<p className="min-w-0">
					<strong>{hasError ? "System issue:" : "System warning:"}</strong>{" "}
					{issues[0].label}
					{issues[0].hint && (
						<span className="ml-1.5 opacity-90 font-normal">
							(Hint: {issues[0].hint})
						</span>
					)}
					{extraCount > 0 && <span className="font-semibold"> + {extraCount} {extraLabel}</span>}
				</p>
			</div>
		</div>
	);
}