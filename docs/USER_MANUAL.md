# CV-Rank User Manual

## Who This Is For

CV-Rank is for hiring managers and recruiters who want to compare several candidate CVs against one role. It supports human review; it does not make hiring decisions.

## Before You Start

The application must be running at `http://localhost:3000`. Ask the technical owner to configure the OpenRouter API key before running an AI analysis.
The **System status** control in the navbar checks the backend and OpenRouter configuration and explains common problems in plain language. Resolve any warning before running an evaluation. Open **Developer Options** for detailed OpenRouter key validity, activity, usage, limit, and reset information. The secret key value is never displayed in the application.

Use synthetic or anonymized CVs during evaluation. Do not upload sensitive documents unless your organization has approved the configured AI provider.

## Evaluate Candidates

1. Open the application.
2. Create a new job or select an existing job.
3. Enter the complete job description.
4. Review and edit the AI-extracted requirements for that specific position.
5. Mark requirements as required or preferred, adjust categories or weights, and add or remove items as needed.
6. Upload one or more PDF CVs by browsing or dragging them into the upload area.
7. Wait until the files show as processed.
8. Select **Run AI Candidate Analysis**.
9. Review the ranked candidate list.
10. Select a candidate to inspect the score breakdown, matched requirements, gaps, and evidence.
11. Save the evaluation project if you need to revisit the result.

## Understanding The Score

The score is from `0` to `100` and combines:

- Required skills: 40%
- Preferred skills: 15%
- Experience: 25%
- Semantic similarity: 20%

The LLM identifies requirements and evidence. A local embedding model compares the meaning of requirements with CV sections. The application calculates the final score and rank.

## Match Labels

- **Strong match:** clear supporting evidence.
- **Partial match:** related or incomplete evidence.
- **No evidence:** the CV does not provide supporting evidence.
- **Contradictory evidence:** the available evidence conflicts with the requirement.

Missing information is not proof that a candidate lacks a qualification.

## When Something Goes Wrong

- A non-PDF or oversized file is rejected.
- A CV that has no readable text cannot be analyzed.
- If the AI provider is unavailable, the application shows an error and does not invent a score.
- Ask the technical owner to check the backend logs and API-key configuration.

## Important Limitation

Scores are specific to the supplied job description and available CV evidence. They are decision-support information, not a complete assessment of a candidate.
