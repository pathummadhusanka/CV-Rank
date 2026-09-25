import type { CandidateMatchDetails, CandidateMatchScores } from "@/lib/api";

export type MatchClassification = "strong" | "partial" | "no_evidence" | "contradictory";

export interface RequirementMatch {
	requirement: string;
	category: "skill" | "experience" | "education" | "projects";
	weight: number;
	status: MatchClassification;
	evidence: string;
	reasoning?: string;
}

export interface RankedCandidate {
	id: string;
	filename: string;
	candidateName?: string;
	rank: number;
	fitScore: number;
	matchDetails?: CandidateMatchDetails;
	scores?: CandidateMatchScores;
	scoreBreakdown?: {
		requiredSkills: number;
		preferredSkills: number;
		experience: number;
		projects?: number;
		semanticSimilarity: number;
	};
	matches: RequirementMatch[];
	strengths: string[];
	gaps: string[];
	explanation: string;
	executiveSummary?: string;
	interviewQuestions?: string[];
}
