import { NavLink } from "react-router";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
	return (
		<div className="space-y-12 py-4 sm:py-6 max-w-6xl mx-auto">
			{/* SECTION 1: HERO & WELCOME */}
			<section className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-10 shadow-xs backdrop-blur-sm space-y-6">
				<div className="max-w-3xl space-y-4">
					<div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1 text-xs font-medium text-muted-foreground">
						<span className="size-2 rounded-full bg-primary animate-pulse" />
						<span>AI Candidate Evaluation &amp; Ranking System</span>
					</div>

					<h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
						Welcome to <span className="text-primary">CV-Rank</span>
					</h1>

					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
						Screen and rank candidate resumes against job descriptions using automated LLM requirement extraction, sentence vector embeddings, verbatim evidence citations, and deterministic hybrid scoring.
					</p>

					<div className="flex flex-wrap items-center gap-3 pt-2">
						<NavLink to="/evaluations">
							<Button size="lg" className="font-bold">
								Start Candidate Evaluation &rarr;
							</Button>
						</NavLink>
						<NavLink to="/jobs">
							<Button variant="outline" size="lg">
								Browse Jobs Library
							</Button>
						</NavLink>
					</div>
				</div>
			</section>

			{/* SECTION 2: HOW IT WORKS STEP-BY-STEP */}
			<section className="space-y-6">
				<div className="space-y-1">
					<span className="text-xs font-bold text-primary uppercase tracking-wider">Step-By-Step Workflow</span>
					<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">How CV-Rank Evaluates Candidates</h2>
					<p className="text-xs sm:text-sm text-muted-foreground">A simple 4-step pipeline from raw job text to auditable candidate rankings.</p>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-xl border border-border bg-card p-5 space-y-2 flex flex-col justify-between">
						<div className="space-y-2">
							<span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
								01
							</span>
							<h3 className="text-sm font-bold text-foreground">Define Job Role</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Input a job title and description. AI extracts structured criteria (skills, required experience, education).
							</p>
						</div>
						<span className="text-[10px] font-semibold text-primary uppercase tracking-wider block pt-2 border-t border-border/40">Powered by AI LLM</span>
					</div>

					<div className="rounded-xl border border-border bg-card p-5 space-y-2 flex flex-col justify-between">
						<div className="space-y-2">
							<span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
								02
							</span>
							<h3 className="text-sm font-bold text-foreground">Select Candidate CVs</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Pick stored resumes from the system CV library, load pre-saved CV Batches, or upload PDF files.
							</p>
						</div>
						<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block pt-2 border-t border-border/40">Library &amp; PDF Storage</span>
					</div>

					<div className="rounded-xl border border-border bg-card p-5 space-y-2 flex flex-col justify-between">
						<div className="space-y-2">
							<span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
								03
							</span>
							<h3 className="text-sm font-bold text-foreground">Evidence Analysis</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
								AI reads candidate resumes, classifies match status, and extracts verbatim text quotes as evidence.
							</p>
						</div>
						<span className="text-[10px] font-semibold text-primary uppercase tracking-wider block pt-2 border-t border-border/40">AI Evidence Engine</span>
					</div>

					<div className="rounded-xl border border-border bg-card p-5 space-y-2 flex flex-col justify-between">
						<div className="space-y-2">
							<span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
								04
							</span>
							<h3 className="text-sm font-bold text-foreground">Leaderboard Ranks</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Deterministic formulas compute 0–100% fit scores combining weighted skills, experience, and vector embeddings.
							</p>
						</div>
						<span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block pt-2 border-t border-border/40">Deterministic Scoring</span>
					</div>
				</div>
			</section>

			{/* SECTION 3: MASTER SCORING FORMULA & WEIGHTS */}
			<section className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
				<div className="space-y-1">
					<span className="text-xs font-bold text-primary uppercase tracking-wider">Transparent Mathematics</span>
					<h2 className="text-2xl font-bold tracking-tight text-foreground">Master Scoring Formula &amp; Weights</h2>
					<p className="text-xs sm:text-sm text-muted-foreground">Candidate fit scores (0–100%) are calculated deterministically using fixed component weights.</p>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-foreground">Required Skills</span>
							<span className="text-sm font-black text-primary">40%</span>
						</div>
						<div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
							<div className="h-full bg-primary w-[40%]" />
						</div>
						<p className="text-[11px] text-muted-foreground">Mandatory technical skills and required job qualifications.</p>
					</div>

					<div className="rounded-xl border border-border bg-background p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-foreground">Experience</span>
							<span className="text-sm font-black text-foreground">25%</span>
						</div>
						<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
							<div className="h-full bg-foreground w-[25%]" />
						</div>
						<p className="text-[11px] text-muted-foreground">Years of relevant industry experience and career history.</p>
					</div>

					<div className="rounded-xl border border-border bg-background p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-foreground">Semantic Similarity</span>
							<span className="text-sm font-black text-foreground">20%</span>
						</div>
						<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
							<div className="h-full bg-foreground w-[20%]" />
						</div>
						<p className="text-[11px] text-muted-foreground">Sentence-BERT vector embedding distance matching.</p>
					</div>

					<div className="rounded-xl border border-border bg-background p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-foreground">Preferred Skills</span>
							<span className="text-sm font-black text-foreground">15%</span>
						</div>
						<div className="h-2 w-full bg-muted rounded-full overflow-hidden">
							<div className="h-full bg-foreground w-[15%]" />
						</div>
						<p className="text-[11px] text-muted-foreground">Nice-to-have bonus qualifications.</p>
					</div>
				</div>

				<div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-xs font-mono text-foreground space-y-1">
					<span className="text-[10px] text-muted-foreground uppercase font-sans font-semibold tracking-wider block">Formula Equation</span>
					<p className="font-bold text-sm">
						Overall Fit Score = (0.40 &times; Required Skills) + (0.25 &times; Experience) + (0.20 &times; Semantic Similarity) + (0.15 &times; Preferred Skills)
					</p>
				</div>
			</section>

			{/* SECTION 4: AI VS DETERMINISTIC COMPARISON */}
			<section className="space-y-6">
				<div className="space-y-1">
					<span className="text-xs font-bold text-primary uppercase tracking-wider">Architecture Overview</span>
					<h2 className="text-2xl font-bold tracking-tight text-foreground">AI Operations vs. Deterministic Logic</h2>
					<p className="text-xs sm:text-sm text-muted-foreground">How AI and math divide responsibilities to eliminate black-box hiring bias.</p>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="rounded-xl border border-border bg-card p-5 space-y-3">
						<div className="flex items-center gap-2 border-b border-border/60 pb-3">
							<span className="size-2 rounded-full bg-primary" />
							<h3 className="text-sm font-bold text-foreground">Generative AI Operations (LLM)</h3>
						</div>
						<ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
							<li><strong className="text-foreground">Requirement Extraction:</strong> Converts raw job text into structured skills, experience, and education criteria.</li>
							<li><strong className="text-foreground">Qualitative Match Classification:</strong> Classifies fit into <em>Strong Match</em>, <em>Partial Match</em>, or <em>No Evidence</em>.</li>
							<li><strong className="text-foreground">Verbatim Quote Citation:</strong> Extracts exact quotes from PDF resumes as verifiable evidence.</li>
						</ul>
					</div>

					<div className="rounded-xl border border-border bg-card p-5 space-y-3">
						<div className="flex items-center gap-2 border-b border-border/60 pb-3">
							<span className="size-2 rounded-full bg-emerald-500" />
							<h3 className="text-sm font-bold text-foreground">Deterministic Math &amp; Vectors</h3>
						</div>
						<ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
							<li><strong className="text-foreground">Semantic Vector Embeddings:</strong> Calculates cosine similarity using Sentence-BERT (`all-MiniLM-L6-v2`).</li>
							<li><strong className="text-foreground">Weighted Sub-Scores:</strong> Calculates exact 0–100% component scores using user-customizable weights.</li>
							<li><strong className="text-foreground">Leaderboard Ranks:</strong> Deterministically sorts candidates by final overall fit score.</li>
						</ul>
					</div>
				</div>
			</section>
		</div>
	);
}
