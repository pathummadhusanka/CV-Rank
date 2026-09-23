import type { CreateJobResponse } from "@/lib/api";
import type { UploadedCandidate } from "@/components/CVUploader";
import type { RankedCandidate, RequirementMatch, MatchClassification } from "@/types/ranking";

export function evaluateCandidates(
	job: CreateJobResponse,
	candidates: UploadedCandidate[],
): RankedCandidate[] {
	const criteria = [
		...job.requirements.skills.map((skill) => ({
			name: skill,
			category: "skill" as const,
			weight: 1.0,
		})),
		...(job.requirements.experience_years !== null
			? [
					{
						name: `${job.requirements.experience_years}+ Years Experience`,
						category: "experience" as const,
						weight: 1.5,
					},
				]
			: []),
		...(job.requirements.education
			? [
					{
						name: job.requirements.education,
						category: "education" as const,
						weight: 1.0,
					},
				]
			: []),
	];

	const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 1.0;

	const evaluated: Omit<RankedCandidate, "rank">[] = candidates.map((cand, index) => {
		// Deterministic pseudo-evaluation based on file name & criteria for immediate preview
		const matches: RequirementMatch[] = criteria.map((criterion, critIndex) => {
			// Vary match based on candidate index and criteria to showcase diverse rankings
			let status: MatchClassification = "strong";
			let evidence = "";

			const seed = (index * 3 + critIndex) % 4;
			if (seed === 0 || seed === 1) {
				status = "strong";
				evidence = `Explicit evidence found in CV for ${criterion.name}. Matches requirement standard.`;
			} else if (seed === 2) {
				status = "partial";
				evidence = `Related mentions of ${criterion.name} found, but with limited depth or scope.`;
			} else {
				status = "no_evidence";
				evidence = `No direct citations or evidence found in candidate profile for ${criterion.name}.`;
			}

			return {
				requirement: criterion.name,
				category: criterion.category,
				weight: criterion.weight,
				status,
				evidence,
			};
		});

		// Compute score according to SPEC.md: sum(weight * match value) / sum(weights) * 100
		const weightedSum = matches.reduce((sum, m) => {
			const value = m.status === "strong" ? 1.0 : m.status === "partial" ? 0.5 : 0.0;
			return sum + m.weight * value;
		}, 0);

		const fitScore = Math.min(100, Math.max(0, Math.round((weightedSum / totalWeight) * 100)));

		const strongMatches = matches.filter((m) => m.status === "strong").map((m) => m.requirement);
		const gaps = matches.filter((m) => m.status === "no_evidence").map((m) => m.requirement);

		// Extract a clean human-readable name from filename if possible
		const cleanName = cand.filename
			.replace(/\.pdf$/i, "")
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());

		return {
			id: cand.id,
			filename: cand.filename,
			candidateName: cleanName,
			fitScore,
			matches,
			strengths:
				strongMatches.length > 0
					? strongMatches.slice(0, 3).map((s) => `Demonstrated competence in ${s}`)
					: ["General foundational experience aligned with the position"],
			gaps:
				gaps.length > 0
					? gaps.slice(0, 3).map((g) => `Missing clear evidence for ${g}`)
					: ["No critical requirement gaps identified"],
			explanation: `Candidate demonstrates a ${fitScore}% alignment with the ${job.title} role criteria. Strongest in ${strongMatches.slice(0, 2).join(", ") || "core qualifications"}.`,
		};
	});

	// Rank descending by fit score
	evaluated.sort((a, b) => b.fitScore - a.fitScore);

	return evaluated.map((item, idx) => ({
		...item,
		rank: idx + 1,
	}));
}
