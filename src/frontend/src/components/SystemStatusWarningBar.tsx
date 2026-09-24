import { useSystemStatus } from "@/components/SystemStatusContext";

type StatusItem = {
	label: string;
	severity: "warning" | "error";
};

export function SystemStatusWarningBar() {
	const { health, aiHealth, checked, checkHealth } = useSystemStatus();

	if (!checked) return null;

	const issues: StatusItem[] = [];
	if (!health || health.status !== "ok") {
		issues.push({ label: "System service is unavailable", severity: "error" });
	}
	if (!aiHealth) {
		issues.push({ label: "OpenRouter status could not be checked", severity: "warning" });
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
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
				<p className="min-w-0 truncate">
					<strong>{hasError ? "System issue:" : "System warning:"}</strong>{" "}
					{issues[0].label}
					{extraCount > 0 && <span className="font-semibold"> + {extraCount} {extraLabel}</span>}
				</p>
				<button
					type="button"
					onClick={checkHealth}
					className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
				>
					Check again
				</button>
			</div>
		</div>
	);
}