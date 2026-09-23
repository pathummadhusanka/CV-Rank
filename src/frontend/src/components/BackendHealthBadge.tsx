import { useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "@/lib/api";

export function BackendHealthBadge() {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
	const [lastChecked, setLastChecked] = useState<Date | null>(null);

	const checkHealth = async () => {
		try {
			const data = await getHealth();
			setHealth(data);
			setStatus("online");
		} catch {
			setStatus("offline");
			setHealth(null);
		} finally {
			setLastChecked(new Date());
		}
	};

	useEffect(() => {
		checkHealth();
		const interval = setInterval(checkHealth, 30000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={checkHealth}
				title={
					status === "online"
						? `Backend online (${health?.service} v${health?.version}) • Checked ${lastChecked?.toLocaleTimeString() ?? ""}`
						: "Backend unreachable • Make sure FastAPI server is running on port 8000 (Click to retry)"
				}
				className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:bg-muted/60 cursor-pointer"
				style={{
					borderColor:
						status === "online"
							? "rgba(34, 197, 94, 0.3)"
							: status === "offline"
								? "rgba(239, 68, 68, 0.3)"
								: "rgba(156, 163, 175, 0.3)",
					backgroundColor:
						status === "online"
							? "rgba(34, 197, 94, 0.08)"
							: status === "offline"
								? "rgba(239, 68, 68, 0.08)"
								: "rgba(156, 163, 175, 0.08)",
				}}
			>
				<span className="relative flex h-2 w-2">
					{status === "online" && (
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
					)}
					<span
						className={`relative inline-flex rounded-full h-2 w-2 ${
							status === "online"
								? "bg-emerald-500"
								: status === "offline"
									? "bg-rose-500"
									: "bg-slate-400"
						}`}
					/>
				</span>

				<span className="font-medium text-foreground">
					{status === "online" && `API Online (v${health?.version ?? "0.1.0"})`}
					{status === "offline" && "API Offline"}
					{status === "checking" && "Connecting..."}
				</span>
			</button>
		</div>
	);
}
