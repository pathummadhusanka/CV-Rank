import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
	getAIHealth,
	getHealth,
	type AIHealthResponse,
	type HealthResponse,
} from "@/lib/api";

type BackendStatus = "checking" | "online" | "offline";

type SystemStatusContextValue = {
	health: HealthResponse | null;
	aiHealth: AIHealthResponse | null;
	backendStatus: BackendStatus;
	lastChecked: Date | null;
	checked: boolean;
	checkHealth: () => Promise<void>;
};

const SystemStatusContext = createContext<SystemStatusContextValue | null>(null);

export function SystemStatusProvider({ children }: { children: ReactNode }) {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [aiHealth, setAIHealth] = useState<AIHealthResponse | null>(null);
	const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
	const [lastChecked, setLastChecked] = useState<Date | null>(null);

	const checkHealth = async () => {
		const [backendResult, aiResult] = await Promise.allSettled([getHealth(), getAIHealth()]);
		if (backendResult.status === "fulfilled") {
			setHealth(backendResult.value);
			setBackendStatus(backendResult.value.status === "ok" ? "online" : "offline");
		} else {
			setHealth(null);
			setBackendStatus("offline");
		}
		setAIHealth(aiResult.status === "fulfilled" ? aiResult.value : null);
		setLastChecked(new Date());
	};

	useEffect(() => {
		checkHealth();
		const interval = setInterval(checkHealth, 30000);
		return () => clearInterval(interval);
	}, []);

	return (
		<SystemStatusContext.Provider
			value={{ health, aiHealth, backendStatus, lastChecked, checked: lastChecked !== null, checkHealth }}
		>
			{children}
		</SystemStatusContext.Provider>
	);
}

export function useSystemStatus() {
	const context = useContext(SystemStatusContext);
	if (!context) throw new Error("useSystemStatus must be used within SystemStatusProvider");
	return context;
}