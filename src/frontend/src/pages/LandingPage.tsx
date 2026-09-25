export default function LandingPage() {
	return (
		<div className="space-y-10 py-4 sm:py-6 max-w-6xl mx-auto">
			{/* SECTION 1: SYSTEM INTRO & WELCOME */}
			<section className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-10 shadow-xs backdrop-blur-sm">
				<div className="max-w-3xl space-y-4">
					<div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
						<span className="size-2 rounded-full bg-primary" />
						<span>AI Candidate Evaluation &amp; Ranking System</span>
					</div>

					<h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-tight">
						Welcome to CV-Rank
					</h1>

					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
						Screen and rank candidate resumes against job descriptions using automated LLM requirement extraction, text section embeddings, and verifiable quote citations.
					</p>
				</div>
			</section>

			{/* SECTION 2: HOW AI IS USED IN REAL SYSTEM USAGE */}
			<section className="space-y-6">
				<div className="space-y-1">
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Operations</span>
					<h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">How AI Powers Candidate Screening</h2>
					<p className="text-xs sm:text-sm text-muted-foreground">The exact 4 AI backend operations executed when evaluating candidates in CV-Rank.</p>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{/* Operation 1 */}
					<div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
						<div className="flex items-center gap-2.5">
							<div className="flex size-7 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-foreground">
								01
							</div>
							<h3 className="text-sm font-bold text-foreground">Job Requirement Extraction</h3>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							When a job description is created, the configured LLM analyzes the text to extract structured requirement objects—categorizing skills, minimum experience years, education, and relative weights.
						</p>
					</div>

					{/* Operation 2 */}
					<div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
						<div className="flex items-center gap-2.5">
							<div className="flex size-7 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-foreground">
								02
							</div>
							<h3 className="text-sm font-bold text-foreground">LLM Requirement Assessment</h3>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							The LLM assesses candidate resume text against each extracted requirement, classifying candidate fit into <em>Strong Match</em>, <em>Partial Match</em>, or <em>No Evidence</em>.
						</p>
					</div>

					{/* Operation 3 */}
					<div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
						<div className="flex items-center gap-2.5">
							<div className="flex size-7 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-foreground">
								03
							</div>
							<h3 className="text-sm font-bold text-foreground">Verbatim Evidence Citations</h3>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							For every match classification, the LLM extracts verbatim quote snippets directly from the candidate&apos;s resume text. You can inspect exact text evidence backing every candidate score.
						</p>
					</div>

					{/* Operation 4 */}
					<div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
						<div className="flex items-center gap-2.5">
							<div className="flex size-7 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-foreground">
								04
							</div>
							<h3 className="text-sm font-bold text-foreground">Weighted Candidate Ranks</h3>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							The backend scoring engine calculates final overall scores combining Required Skills (40%), Experience (25%), Semantic Vector Distance (20%), and Preferred Skills (15%) to rank candidates into an auditable leaderboard.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
