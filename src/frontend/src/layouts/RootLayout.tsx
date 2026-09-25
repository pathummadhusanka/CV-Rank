import { NavLink, Outlet } from "react-router";
import { BackendHealthBadge } from "@/components/BackendHealthBadge";
import { SystemStatusProvider } from "@/components/SystemStatusContext";
import { SystemStatusWarningBar } from "@/components/SystemStatusWarningBar";
import { cn } from "@/lib/utils";

export default function RootLayout() {
	return (
		<SystemStatusProvider>
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			<header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="relative mx-auto flex min-h-14 w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
					<div className="flex min-w-0 flex-1 items-center gap-6">
						<NavLink to="/" className="flex items-center gap-2 font-bold text-sm tracking-tight">
							<div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-xs shadow-xs">
								CV
							</div>
							<span className="text-base font-semibold">CV-Rank</span>
							<span className="hidden sm:inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground border border-border">
								AI Evaluator
							</span>
						</NavLink>
					</div>

					<nav className="order-3 flex w-full min-w-0 flex-wrap items-center justify-center gap-1.5 overflow-visible sm:order-none sm:w-auto sm:flex-nowrap lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-20 pointer-events-auto">
						<NavLink to="/dashboard" className={({ isActive }) => cn("shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", isActive ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>Dashboard</NavLink>
						<NavLink to="/evaluations" className={({ isActive }) => cn("shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", isActive ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>Evaluator</NavLink>
						<NavLink to="/jobs" className={({ isActive }) => cn("shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", isActive ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>Jobs Library</NavLink>
						<NavLink to="/cvs" className={({ isActive }) => cn("shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", isActive ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>CV Library</NavLink>
					</nav>

					<div className="flex shrink-0 items-center justify-end gap-2 sm:flex-1">
						<NavLink
							to="/developer-options"
							className={({ isActive }) => cn(
								"shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
								isActive ? "bg-secondary font-semibold text-secondary-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
							)}
						>
							Developer Options
						</NavLink>
						<BackendHealthBadge />
					</div>
				</div>
			</header>
			<SystemStatusWarningBar />

			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<Outlet />
			</main>

			<footer className="border-t border-border/60 py-4 px-4 text-center text-xs text-muted-foreground">
				<p>CV-Rank &bull; AI-Powered Candidate Evaluation &amp; Ranking System</p>
			</footer>
		</div>
		</SystemStatusProvider>
	);
}

