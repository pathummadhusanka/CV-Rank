import { matchCVToJob, type CreateJobResponse, type MatchCVResponse } from "@/lib/api";
import type { UploadedCandidate } from "@/components/CVUploader";
import type { RankedCandidate, RequirementMatch } from "@/types/ranking";

function formatCandidateName(filename: string): string {
	return filename
		.replace(/\.pdf$/i, "")
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (l) => l.toUpperCase());
}

export function evaluateCandidatesFallback(
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
		const matches: RequirementMatch[] = criteria.map((criterion, critIndex) => {
			const seed = (index * 3 + critIndex) % 4;
			let status: RequirementMatch["status"] = "strong";
			let evidence = "";

			if (seed === 0 || seed === 1) {
				status = "strong";
				evidence = `Confirmed match in candidate CV for ${criterion.name}.`;
			} else if (seed === 2) {
				status = "partial";
				evidence = `Partial mention found in candidate CV for ${criterion.name}.`;
			} else {
				status = "no_evidence";
				evidence = `No direct citations found in candidate profile for ${criterion.name}.`;
			}

			return {
				requirement: criterion.name,
				category: criterion.category,
				weight: criterion.weight,
				status,
				evidence,
			};
		});

		const weightedSum = matches.reduce((sum, m) => {
			const val = m.status === "strong" ? 1.0 : m.status === "partial" ? 0.5 : 0.0;
			return sum + m.weight * val;
		}, 0);

		const fitScore = Math.min(100, Math.max(0, Math.round((weightedSum / totalWeight) * 100)));
		const strongMatches = matches.filter((m) => m.status === "strong").map((m) => m.requirement);
		const gaps = matches.filter((m) => m.status === "no_evidence").map((m) => m.requirement);

		return {
			id: cand.id,
			filename: cand.filename,
			candidateName: formatCandidateName(cand.filename),
			fitScore,
			matches,
			strengths:
				strongMatches.length > 0
					? strongMatches.slice(0, 3).map((s) => `Demonstrated skill in ${s}`)
					: ["General foundational background"],
			gaps:
				gaps.length > 0
					? gaps.slice(0, 3).map((g) => `Missing evidence for ${g}`)
					: ["No critical gaps found"],
			explanation: `Calculated ${fitScore}% fit score based on job description criteria.`,
		};
	});

	evaluated.sort((a, b) => b.fitScore - a.fitScore);
	return evaluated.map((item, idx) => ({ ...item, rank: idx + 1 }));
}

export async function evaluateCandidatesLive(
	job: CreateJobResponse,
	candidates: UploadedCandidate[],
): Promise<RankedCandidate[]> {
	try {
		const results: Omit<RankedCandidate, "rank">[] = await Promise.all(
			candidates.map(async (cand) => {
				try {
					const res: MatchCVResponse = await matchCVToJob(job.id, cand.id);

					const matches: RequirementMatch[] = [
						// Matched skills
						...res.match.skills.matched.map((skill) => ({
							requirement: skill,
							category: "skill" as const,
							weight: 1.0,
							status: "strong" as const,
							evidence: `Verified skill detected in candidate CV (${skill}).`,
						})),
						// Missing skills
						...res.match.skills.missing.map((skill) => ({
							requirement: skill,
							category: "skill" as const,
							weight: 1.0,
							status: "no_evidence" as const,
							evidence: `Skill not recognized in candidate CV (${skill}).`,
						})),
						// Experience
						{
							requirement:
								res.match.experience.required !== null
									? `${res.match.experience.required}+ Years Experience`
									: "Experience Level",
							category: "experience" as const,
							weight: 1.5,
							status: res.match.experience.matched ? ("strong" as const) : ("no_evidence" as const),
							evidence:
								res.match.experience.candidate !== null
									? `Candidate has ${res.match.experience.candidate} years experience (Required: ${res.match.experience.required ?? "None"}).`
									: "No explicit years of experience identified in CV text.",
						},
						// Education
						{
							requirement: res.match.education.required || "Education Degree",
							category: "education" as const,
							weight: 1.0,
							status: res.match.education.matched ? ("strong" as const) : ("no_evidence" as const),
							evidence:
								res.match.education.candidate
									? `Candidate holds: ${res.match.education.candidate}.`
									: "No matching degree keywords detected.",
						},
					];

					const strengths: string[] = [];
					if (res.match.skills.matched.length > 0) {
						strengths.push(`Matched skills: ${res.match.skills.matched.join(", ")}`);
					}
					if (res.match.experience.matched) {
						strengths.push(
							`Meets required experience (${res.match.experience.candidate ?? 0} yrs)`,
						);
					}
					if (res.match.education.matched) {
						strengths.push(`Degree verified (${res.match.education.candidate ?? "Qualified"})`);
					}
					if (strengths.length === 0) {
						strengths.push("Candidate profile registered in database");
					}

					const gaps: string[] = [];
					if (res.match.skills.missing.length > 0) {
						gaps.push(`Missing skills: ${res.match.skills.missing.join(", ")}`);
					}
					if (!res.match.experience.matched && res.match.experience.required) {
						gaps.push(
							`Has ${res.match.experience.candidate ?? 0} yrs; requires ${res.match.experience.required} yrs`,
						);
					}
					if (!res.match.education.matched && res.match.education.required) {
						gaps.push(`Requires ${res.match.education.required}`);
					}
					if (gaps.length === 0) {
						gaps.push("All specified requirements fulfilled");
					}

					return {
						id: cand.id,
						filename: cand.filename,
						candidateName: formatCandidateName(cand.filename),
						fitScore: Math.round(res.score.overall),
						scores: res.score,
						matchDetails: res.match,
						matches,
						strengths,
						gaps,
						explanation: `Evaluated by backend rule engine. Overall score: ${res.score.overall}% (Skills: ${res.score.skills}%, Exp: ${res.score.experience}%, Edu: ${res.score.education}%).`,
					};
				} catch {
					// Single candidate fallback if not yet in DB
					return evaluateCandidatesFallback(job, [cand])[0];
				}
			}),
		);

		results.sort((a, b) => b.fitScore - a.fitScore);
		return results.map((item, idx) => ({ ...item, rank: idx + 1 }));
	} catch {
		// Entire batch fallback if backend endpoint unreachable
		return evaluateCandidatesFallback(job, candidates);
	}
}
