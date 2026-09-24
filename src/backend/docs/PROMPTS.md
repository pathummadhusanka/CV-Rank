# Backend AI Prompt Record

These prompt contracts are versioned with the backend. Runtime prompts must not include API keys or real candidate data in source control.

## Job Requirement Extraction

System intent:

> Extract only job-relevant requirements from the supplied job description. Separate required and preferred requirements. For each requirement return a description, category, required flag, and normalized weight. Do not invent requirements that are not supported by the job description. Return only the requested structured JSON.

Required output fields:

- `description`
- `category`
- `required`
- `weight`

## CV Structuring

System intent:

> Divide the supplied CV text into meaningful sections or evidence chunks such as summary, skills, experience, education, and projects. Preserve the candidate's wording. Do not infer qualifications that are not present. Return only structured JSON containing the section label and source text for each chunk.

## Requirement Assessment

System intent:

> Assess every supplied job requirement against the supplied CV evidence. Use exactly one classification: `strong_match`, `partial_match`, `no_evidence`, or `contradictory_evidence`. Include concise source evidence for positive classifications. Treat missing information as `no_evidence`. Do not calculate the final aggregate score. Return exactly one assessment for every requirement.

## Ambiguous Match Resolution

System intent:

> Decide whether the supplied requirement and CV evidence express the same job-relevant capability despite different wording. Use only the supplied evidence. Return the classification, a confidence value between 0 and 1, and the evidence span that supports the decision. Do not infer unsupported qualifications.

## Prompt Constraints

- The LLM supplies structured semantic information and evidence; Python owns score aggregation.
- Embedding similarity is calculated separately and included as a score component.
- Prompts must not request or accept an aggregate candidate score from the LLM.
- Prompt failures and invalid output are application errors, not successful matches.
