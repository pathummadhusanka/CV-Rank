import { NavLink, Outlet } from "react-router";
import { BackendHealthBadge } from "@/components/BackendHealthBadge";
import { cn } from "@/lib/utils";

export default function RootLayout() {
	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground">
			<header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
					<div className="flex items-center gap-6">
						<NavLink to="/" className="flex items-center gap-2 font-bold text-sm tracking-tight">
							<div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-xs shadow-xs">
								CV
							</div>
							<span className="text-base font-semibold">CV-Rank</span>
							<span className="hidden sm:inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground border border-border">
								AI Evaluator
							</span>
						</NavLink>

						<nav className="flex items-center gap-1.5">
							<NavLink
								to="/"
								end
								className={({ isActive }) =>
									cn(
										"px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
										isActive
											? "bg-secondary text-secondary-foreground font-semibold"
											: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
									)
								}
							>
								Evaluations
							</NavLink>
							<NavLink
								to="/jobs"
								className={({ isActive }) =>
									cn(
										"px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
										isActive
											? "bg-secondary text-secondary-foreground font-semibold"
											: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
									)
								}
							>
								Jobs Library
							</NavLink>
							<NavLink
								to="/cvs"
								className={({ isActive }) =>
									cn(
										"px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
										isActive
											? "bg-secondary text-secondary-foreground font-semibold"
											: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
									)
								}
							>
								CV Library
							</NavLink>
							<NavLink
								to="/dashboard"
								className={({ isActive }) =>
									cn(
										"px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
										isActive
											? "bg-secondary text-secondary-foreground font-semibold"
											: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
									)
								}
							>
								Dashboard
							</NavLink>
						</nav>
					</div>

					<div className="flex items-center gap-3">
						<BackendHealthBadge />
					</div>
				</div>
			</header>

			<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<Outlet />
			</main>

			<footer className="border-t border-border/60 py-4 px-4 text-center text-xs text-muted-foreground">
				<p>CV-Rank &bull; AI-Powered Candidate Evaluation &amp; Ranking System</p>
			</footer>
		</div>
	);
}

