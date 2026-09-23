import type { CandidateMatchDetails, CandidateMatchScores } from "@/lib/api";

export type MatchClassification = "strong" | "partial" | "no_evidence" | "contradictory";

export interface RequirementMatch {
	requirement: string;
	category: "skill" | "experience" | "education";
	weight: number;
	status: MatchClassification;
	evidence: string;
}

export interface RankedCandidate {
	id: string;
	filename: string;
	candidateName?: string;
	rank: number;
	fitScore: number;
	matchDetails?: CandidateMatchDetails;
	scores?: CandidateMatchScores;
	matches: RequirementMatch[];
	strengths: string[];
	gaps: string[];
	explanation: string;
}
