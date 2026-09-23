# CV-Rank

## CV Scoring and Ranking System

## 1. Goal

Build a web application that compares candidate CVs against a job description using AI.

The system should:

* Identify job requirements.
* Match CVs against those requirements.
* Score each candidate from 0 to 100.
* Rank candidates.
* Explain the score using evidence from the CV.

The system supports human review and does not make autonomous hiring decisions.

## 2. User

The primary user is a hiring manager or recruiter.

The user can:

1. Enter a job description.
2. Upload multiple CVs.
3. Run the analysis.
4. View the ranked candidates.
5. Review the score and supporting evidence for each candidate.

## 3. Scope

### In scope

* Job description input
* Multiple CV uploads
* PDF CV processing
* AI-based requirement extraction
* AI-based semantic CV matching
* Weighted candidate scoring
* Candidate ranking
* Score breakdown
* Evidence and explanation
* Basic error handling
* Docker deployment

### Out of scope

* User accounts
* Candidate database
* Candidate communication
* Interview scheduling
* Background checks
* Personality assessment
* Social media analysis
* Autonomous hiring decisions
* Model training or fine-tuning
* Advanced analytics

## 4. Inputs

The system accepts:

* One job description
* One or more candidate CVs

The initial version supports PDF CVs.

## 5. Outputs

For each candidate, the system provides:

* Candidate name, when available
* Rank
* Fit score
* Requirement-level matches
* Supporting evidence
* Strengths
* Gaps
* Short explanation

## 6. Requirement Extraction

An AI language model extracts relevant requirements from the job description.

Each requirement contains:

* Description
* Category
* Required or preferred status
* Weight

The system should focus on requirements that are relevant to the role.

## 7. Candidate Matching

AI evaluates each candidate against the extracted requirements.

Each requirement receives one classification:

* Strong match
* Partial match
* No evidence
* Contradictory evidence

The AI must provide supporting evidence where available.

The system must not invent qualifications or experience.

Missing information is treated as no evidence, not proof that the candidate lacks the skill.

## 8. Scoring

The Fit Score is a value from 0 to 100.

The score represents how well the available evidence in the CV matches the requirements of the job.

Match values:

* Strong match: 1.0
* Partial match: 0.5
* No evidence: 0.0
* Contradictory evidence: 0.0

The score is calculated by application code using the requirement weights.

```text
score = sum(weight × match value) / sum(weights) × 100
```

The AI does not directly determine the final score.

## 9. Ranking

Candidates are ranked by their calculated Fit Score.

Ranking is performed by application code.

## 10. AI Usage

AI is responsible for:

* Understanding the job description
* Extracting requirements
* Understanding CV content
* Semantic matching
* Match classification
* Evidence and explanations

Application code is responsible for:

* File processing
* Input validation
* AI response validation
* Score calculation
* Ranking
* Presentation

AI responses should use structured data and be validated before scoring.

## 11. Error Handling

The system should handle:

* Missing job descriptions
* No CVs
* Unsupported files
* CV extraction failures
* AI/API failures
* Invalid AI responses

Errors should be shown as clear user-facing messages. Internal errors and stack traces should not be exposed.

## 12. Assumptions

* One job description is evaluated at a time.
* Multiple CVs can be evaluated against the job.
* The initial version supports PDF files.
* The job description contains enough information to identify requirements.
* CVs contain enough readable information for evaluation.
* Missing information is treated as no evidence.
* AI results may be incorrect and require human review.
* The hiring team makes the final decision.

## 13. Security and Privacy

* AI API keys are provided through environment variables.
* API keys must not be stored in source code or Git.
* API keys must remain server-side.
* Real candidate CVs must not be committed to the repository.
* Test data should be synthetic or anonymized.
* Scoring should be based on job-relevant information.

## 14. Known Limitations

* CV formatting can affect text extraction.
* AI may incorrectly interpret requirements or CV evidence.
* A CV may omit skills that a candidate actually has.
* Poor job descriptions may produce poor requirements.
* Fit scores are specific to the supplied job description and are not a measure of overall candidate ability.

## 15. Acceptance Criteria

The system is complete when a user can:

1. Enter a job description.
2. Upload multiple PDF CVs.
3. Run the analysis.
4. Receive AI-extracted requirements.
5. Receive AI-based candidate matches.
6. Receive a deterministic Fit Score for each candidate.
7. View candidates ranked by score.
8. Review the evidence and explanation for each score.
9. Handle common input and AI failures without the application crashing.
10. Run the application in a single Docker container with the AI API key supplied at runtime.
