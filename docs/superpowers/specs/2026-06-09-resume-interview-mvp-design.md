# Resume Interview MVP Design

## Goal

Build a resume-driven mock interview app. The app reads a candidate resume, generates interview questions based on that resume, lets the candidate answer one question at a time, and immediately shows a reference answer plus feedback after each submitted answer.

The first version should focus on interview practice quality rather than account systems, video calls, or a large question bank.

## User Flow

1. The user uploads or pastes a resume.
2. The user enters the target role, such as backend engineer, frontend engineer, product manager, or data analyst.
3. The app extracts a structured candidate profile from the resume.
4. The app generates 8 to 10 resume-specific interview questions.
5. Each question includes a reference answer, scoring rubric, and possible follow-up questions.
6. The interview view shows one question at a time.
7. The user submits an answer.
8. The app immediately shows the reference answer, score, strengths, weaknesses, improved answer, and follow-up question.
9. After all questions, the app generates a final practice report.

## MVP Scope

The MVP includes:

- Resume input by text paste.
- Optional file upload for PDF, DOCX, and TXT if parsing libraries are available.
- Target role input.
- Question generation based on resume content.
- Immediate reference answer after each submitted response.
- Per-question feedback.
- Final interview report.

The MVP does not include:

- User login.
- Payment.
- Video interview.
- Voice transcription.
- Company-specific interview style.
- Long-term interview history.

## Core Experience

The interview experience should not show the reference answer before the user answers. Showing the answer too early turns the app into a question bank instead of a mock interview.

Each question card has two phases.

Before submission:

- Interview question.
- What the question is testing.
- Answer input box.
- Submit button.

After submission:

- Reference answer.
- Score out of 10.
- Strengths in the user's answer.
- Missing or weak points.
- Improved version of the user's answer.
- Possible follow-up question.

## Data Model

### Candidate Profile

```json
{
  "target_role": "Backend Engineer",
  "seniority": "3-5 years",
  "skills": ["Java", "Spring Boot", "Redis", "MySQL"],
  "projects": [
    {
      "name": "Order System",
      "summary": "Optimized order query performance with caching",
      "highlights": ["Redis cache", "high concurrency", "database optimization"]
    }
  ],
  "risk_points": [
    "Cache consistency details may need deeper explanation",
    "System design experience is unclear"
  ]
}
```

### Interview Question

```json
{
  "id": "q1",
  "question": "You mentioned using Redis to optimize order query performance. What was the original bottleneck, and how did you design the cache strategy?",
  "intent": "Evaluate whether the candidate truly understands cache design, performance bottlenecks, and consistency tradeoffs.",
  "difficulty": "medium",
  "reference_answer": "A strong answer should first describe the business scenario and the measured bottleneck, then explain cache key design, expiration policy, cache penetration protection, cache breakdown handling, and database-cache consistency strategy. It should include concrete metrics where possible.",
  "scoring_rubric": [
    "Explains the business and performance context",
    "Identifies the bottleneck with data",
    "Describes cache strategy clearly",
    "Mentions failure modes and consistency handling",
    "Uses concrete project details from the resume"
  ],
  "follow_up_questions": [
    "How would you detect cache and database inconsistency?",
    "What would you do if a hot key expired and traffic hit the database?"
  ]
}
```

### Answer Feedback

```json
{
  "score": 7,
  "strengths": [
    "Explained the business background",
    "Mentioned Redis cache usage"
  ],
  "weaknesses": [
    "Did not explain cache consistency",
    "Did not include performance metrics"
  ],
  "improved_answer": "In this project, the main bottleneck was repeated order detail queries during peak traffic...",
  "follow_up_question": "If cache data and database data become inconsistent, how would you troubleshoot it?"
}
```

## LLM Prompts

### Candidate Profile Prompt

```text
You are a senior technical recruiter and interview designer.

Extract a structured candidate profile from the resume below.

Return JSON with:
- target_role
- seniority
- skills
- projects
- risk_points

The risk_points should identify areas an interviewer is likely to challenge or ask follow-up questions about.

Resume:
{{resume_text}}

Target role:
{{target_role}}
```

### Question Generation Prompt

```text
You are a senior interviewer.

Generate 8 to 10 mock interview questions based on the candidate profile and resume.

Each question must include:
1. question
2. intent
3. difficulty
4. reference_answer
5. scoring_rubric
6. follow_up_questions

Rules:
- Questions must be tied to the resume.
- Prioritize project deep dives, technical fundamentals, system design, and behavioral questions.
- Reference answers should sound like strong interview responses, not textbook definitions.
- Reference answers should include project-specific details whenever possible.
- Return valid JSON only.

Candidate profile:
{{candidate_profile}}

Resume:
{{resume_text}}
```

### Feedback Prompt

```text
You are an interviewer and career coach.

Evaluate the candidate's answer.

Question:
{{question}}

Reference answer:
{{reference_answer}}

Scoring rubric:
{{scoring_rubric}}

Candidate answer:
{{candidate_answer}}

Return JSON with:
- score
- strengths
- weaknesses
- improved_answer
- follow_up_question

Rules:
- Be specific and practical.
- Compare the answer against the reference answer and rubric.
- The improved answer should preserve the candidate's experience instead of inventing fake facts.
```

## Suggested Architecture

The first implementation can be a simple web app:

- Frontend: Next.js or React.
- Backend API: Next.js API routes, Node.js, or Python FastAPI.
- LLM provider: configurable through an environment variable.
- Resume parsing: text paste first; PDF and DOCX parsing can be added with libraries.
- Storage: in-memory session state for MVP, then SQLite or PostgreSQL later.

Recommended first version:

- Next.js app with API routes.
- Text resume input as the default.
- No database in v1.
- Keep interview state in the browser during a session.

## Main Components

### ResumeInput

Collects resume text and target role. It validates that the resume has enough content before starting generation.

### ProfileExtractor

Calls the LLM to convert resume text into a structured candidate profile.

### QuestionGenerator

Calls the LLM to generate resume-specific questions with built-in reference answers.

### InterviewSession

Shows one question at a time. It hides the reference answer until the user submits an answer.

### FeedbackEvaluator

Calls the LLM to compare the user's answer with the reference answer and scoring rubric.

### FinalReport

Summarizes scores, weak areas, strong areas, and recommended practice topics.

## Error Handling

- If resume text is too short, ask the user to paste a more complete resume.
- If the LLM returns invalid JSON, retry once with a stricter JSON-only prompt.
- If question generation fails, show a clear retry action.
- If feedback generation fails, keep the user's answer and allow retry.
- If file parsing fails, fall back to manual text paste.

## Testing

MVP testing should cover:

- Resume text validation.
- JSON parsing and retry behavior.
- Question generation response shape.
- Interview flow: question hidden answer, submit, reveal reference answer and feedback.
- Final report generation.

## Acceptance Criteria

- A user can paste a resume and target role.
- The app generates at least 8 interview questions from the resume.
- Every question has a reference answer.
- The reference answer is hidden before the user submits an answer.
- After submission, the user immediately sees the reference answer and feedback.
- The final report summarizes performance and weak areas.

