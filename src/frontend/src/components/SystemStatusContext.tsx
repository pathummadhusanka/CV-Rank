import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
	getAIHealth,
	getHealth,
	type AIHealthResponse,
	type HealthResponse,
} from "@/lib/api";

const HEALTH_CHECK_INTERVAL_MS = 30000;
const STARTUP_GRACE_PERIOD_MS = HEALTH_CHECK_INTERVAL_MS + 5000;

type BackendStatus = "checking" | "online" | "offline";

type SystemStatusContextValue = {
	health: HealthResponse | null;
	aiHealth: AIHealthResponse | null;
	backendStatus: BackendStatus;
	lastChecked: Date | null;
	checked: boolean;
	isStarting: boolean;
	isChecking: boolean;
	checkHealth: () => Promise<void>;
};

const SystemStatusContext = createContext<SystemStatusContextValue | null>(null);

export function SystemStatusProvider({ children }: { children: ReactNode }) {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [aiHealth, setAIHealth] = useState<AIHealthResponse | null>(null);
	const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
	const [lastChecked, setLastChecked] = useState<Date | null>(null);
	const [isStarting, setIsStarting] = useState(true);
	const [isChecking, setIsChecking] = useState(false);

	const checkHealth = async () => {
		setIsChecking(true);
		try {
			const [backendResult, aiResult] = await Promise.allSettled([getHealth(), getAIHealth()]);
			if (backendResult.status === "fulfilled") {
				setHealth(backendResult.value);
				setBackendStatus(backendResult.value.status === "ok" ? "online" : "offline");
				setIsStarting(false);
			} else {
				setHealth(null);
				setBackendStatus("offline");
			}
			setAIHealth(aiResult.status === "fulfilled" ? aiResult.value : null);
			setLastChecked(new Date());
		} finally {
			setIsChecking(false);
		}
	};

	useEffect(() => {
		checkHealth();
		const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS);
		const startupTimer = setTimeout(() => setIsStarting(false), STARTUP_GRACE_PERIOD_MS);
		return () => {
			clearInterval(interval);
			clearTimeout(startupTimer);
		};
	}, []);

	return (
		<SystemStatusContext.Provider
			value={{ health, aiHealth, backendStatus, lastChecked, checked: lastChecked !== null, isStarting, isChecking, checkHealth }}
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