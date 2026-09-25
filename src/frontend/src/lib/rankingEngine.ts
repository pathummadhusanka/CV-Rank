import { analyzeJob, type AIAnalysisCandidate, type AIAssessmentClassification, type AIRequirement } from "@/lib/api";
import type { UploadedCandidate } from "@/components/CVUploader";
import type { MatchClassification, RankedCandidate, RequirementMatch } from "@/types/ranking";

function formatCandidateName(filename: string): string {
	return filename
		.replace(/\.pdf$/i, "")
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapClassification(classification: AIAssessmentClassification): MatchClassification {
	if (classification === "strong_match") return "strong";
	if (classification === "partial_match") return "partial";
	if (classification === "contradictory_evidence") return "contradictory";
	return "no_evidence";
}

function mapCategory(category: string): RequirementMatch["category"] {
	const normalized = category.toLowerCase();
	if (normalized.includes("project") || normalized.includes("portfolio")) return "projects";
	if (normalized.includes("experience")) return "experience";
	if (normalized.includes("education")) return "education";
	return "skill";
}

function mapCandidate(candidate: AIAnalysisCandidate): RankedCandidate {
	const matches: RequirementMatch[] = candidate.matches.map((item) => ({
		requirement: item.requirement.description,
		category: mapCategory(item.requirement.category),
		weight: item.requirement.weight,
		status: mapClassification(item.classification),
		evidence: item.evidence.join(" ") || "No evidence provided.",
		reasoning: item.reasoning,
	}));

	return {
		id: candidate.cv_id,
		filename: candidate.filename,
		candidateName: formatCandidateName(candidate.filename),
		rank: candidate.rank,
		fitScore: Math.round(candidate.overall_score),
		matches,
		scoreBreakdown: {
			requiredSkills: candidate.required_skill_score,
			preferredSkills: candidate.preferred_skill_score,
			experience: candidate.experience_score,
			semanticSimilarity: candidate.semantic_similarity_score,
			projects: candidate.project_score,
		},
		strengths: candidate.strengths,
		gaps: candidate.gaps,
		explanation: candidate.explanation,
		executiveSummary: candidate.executive_summary,
		interviewQuestions: candidate.interview_questions,
	};
}

export async function evaluateCandidatesLive(
	jobId: string,
	candidates: UploadedCandidate[],
	requirements: AIRequirement[],
): Promise<RankedCandidate[]> {
	const analysis = await analyzeJob(jobId, candidates.map((candidate) => candidate.id), requirements);
	return analysis.candidates.map(mapCandidate);
}
