# How CV-Rank Works: AI & Deterministic Scoring Explained

Welcome to **CV-Rank**! This guide explains simply and clearly how CV-Rank evaluates candidate resumes, how AI and mathematical scoring work together, and how final fit scores and ranks are calculated.

---

## 🌟 High-Level Overview

CV-Rank combines **Generative AI (LLM)** with **Deterministic Mathematical Formulas** to screen candidate resumes against job requirements.

- **AI is used for qualitative tasks**: Reading job descriptions, extracting criteria, finding verbatim evidence in candidate resumes, and classifying matches.
- **Deterministic Math is used for quantitative tasks**: Calculating exact component scores (0–100%), applying fixed percentage weights, vector similarity calculations, and generating auditable rankings.

This hybrid approach ensures that evaluations are **intelligent**, **fair**, **transparent**, and **100% reproducible**.

---

## 🔄 End-to-End Evaluation Workflow

```
┌───────────────────────────────┐
│  Step 1: Define Job Position  │ ──> AI extracts role requirements (skills, experience, education)
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│  Step 2: Choose Resumes       │ ──> Select from CV Library, pre-saved Batches, or Upload PDFs
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│  Step 3: AI Evidence Analysis │ ──> LLM finds exact quotes in CVs & classifies match quality
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│  Step 4: Vector Similarity    │ ──> Sentence-BERT embeddings compute semantic similarity
└───────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│  Step 5: Weighted Fit Score   │ ──> Mathematical formula calculates overall 0–100% score & ranks
└───────────────────────────────┘
```

---

## 🤖 AI vs. 📐 Deterministic Logic

| Feature | Powered By | How It Works |
| :--- | :--- | :--- |
| **Requirement Extraction** | **Generative AI (LLM)** | Converts raw job text into structured criteria (skills, required experience, education). |
| **Candidate Assessment** | **Generative AI (LLM)** | Reads unstructured PDF resumes and classifies each requirement into *Strong Match*, *Partial Match*, or *No Evidence*. |
| **Evidence Quoting** | **Generative AI (LLM)** | Extracts verbatim quotes directly from the candidate's CV as evidence for every match. |
| **Semantic Matching** | **Vector Embeddings (Math)** | Uses Sentence-BERT (`all-MiniLM-L6-v2`) to compute cosine vector similarity between job criteria and CV text chunks. |
| **Component Scoring** | **Deterministic Formula** | Computes weighted sub-scores for Required Skills, Preferred Skills, and Experience. |
| **Final Ranks & Leaderboard** | **Deterministic Formula** | Computes master 0–100% overall fit score and ranks candidates deterministically. |

---

## ⚖️ Weight Calculation & Master Scoring Formula

CV-Rank calculates candidate fit using **4 core components**. Each component contributes a specific percentage to the final **Overall Fit Score (0–100%)**:

### Component Weight Distribution

| Component | Weight | Description |
| :--- | :---: | :--- |
| **Required Skills** | **40%** | Mandatory technical skills and core capabilities needed for the position. |
| **Relevant Experience** | **25%** | Years of experience and relevant industry history. |
| **Semantic Similarity** | **20%** | Vector distance match between job description and resume content. |
| **Preferred Skills** | **15%** | Nice-to-have bonus qualifications. |

---

### Master Scoring Formula

$$\text{Overall Fit Score} = (0.40 \times S_{\text{req}}) + (0.15 \times S_{\text{pref}}) + (0.25 \times S_{\text{exp}}) + (0.20 \times S_{\text{sem}})$$

Where:
1. **$S_{\text{req}}$ (Required Skills Score)**:
   $$S_{\text{req}} = \frac{\sum (\text{Match Value} \times \text{Weight})}{\sum \text{Weight}} \times 100$$
2. **$S_{\text{pref}}$ (Preferred Skills Score)**:
   $$S_{\text{pref}} = \frac{\sum (\text{Match Value} \times \text{Weight})}{\sum \text{Weight}} \times 100$$
3. **$S_{\text{exp}}$ (Experience Score)**:
   $$S_{\text{exp}} = \frac{\sum (\text{Match Value} \times \text{Weight})}{\sum \text{Weight}} \times 100$$
4. **$S_{\text{sem}}$ (Semantic Vector Score)**:
   $$S_{\text{sem}} = \text{Average Cosine Similarity of CV Chunks} \times 100$$

#### Match Values:
- **Strong Match** = `1.0` (100% credit)
- **Partial Match** = `0.5` (50% credit)
- **No Evidence / Contradictory** = `0.0` (0% credit)

---

## 🔍 Example Calculation

Suppose a candidate receives the following sub-scores for a Software Engineer role:
- **Required Skills ($S_{\text{req}}$)**: `90%`
- **Preferred Skills ($S_{\text{pref}}$)**: `70%`
- **Relevant Experience ($S_{\text{exp}}$)**: `80%`
- **Semantic Similarity ($S_{\text{sem}}$)**: `85%`

Their **Overall Fit Score** is calculated as:

$$\text{Score} = (0.40 \times 90) + (0.15 \times 70) + (0.25 \times 80) + (0.20 \times 85)$$
$$\text{Score} = 36.0 + 10.5 + 20.0 + 17.0 = \mathbf{83.5\%} \approx \mathbf{84\%}$$

Candidate ranks are ordered strictly by overall fit score.

---

## 🛡️ Transparency & Verifiability

- **No Black Box**: Every score is accompanied by exact verbatim evidence quotes extracted directly from the candidate's CV.
- **Human Control**: Recruiters can review and adjust requirement descriptions, categories, and weights before running evaluations.
- **Audit History**: All runs can be saved to Projects History or exported to CSV for complete hiring compliance.
