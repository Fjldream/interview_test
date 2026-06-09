# Resume Interview MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable resume-driven mock interview MVP that generates resume-based questions, hides reference answers until submission, and gives immediate feedback.

**Architecture:** Use a zero-dependency Node.js HTTP server with static browser assets. Server modules own validation, JSON parsing, prompt construction, OpenAI Responses API calls, and deterministic mock fallback. The frontend keeps interview session state in the browser and calls API routes for generation and evaluation.

**Tech Stack:** Node.js built-in `http`, `node:test`, browser HTML/CSS/JavaScript, optional OpenAI Responses API through `fetch`.

---

## File Structure

- `package.json`: scripts for test and dev commands.
- `.gitignore`: ignore generated files and local env.
- `README.md`: setup, API key, and run instructions.
- `src/config.js`: environment-driven runtime config.
- `src/json.js`: robust JSON extraction and parsing helper.
- `src/validation.js`: request validation helpers.
- `src/mockInterview.js`: deterministic fallback profile, questions, feedback, and report.
- `src/openaiClient.js`: OpenAI Responses API wrapper with JSON schema support.
- `src/interviewService.js`: orchestration for profile extraction, question generation, feedback, and reports.
- `src/server.js`: HTTP routes and static file serving.
- `public/index.html`: application shell.
- `public/styles.css`: responsive app styling.
- `public/app.js`: browser interview flow.
- `tests/json.test.js`: JSON helper tests.
- `tests/validation.test.js`: validation tests.
- `tests/interviewService.test.js`: service behavior with mock client.
- `tests/server.test.js`: API route smoke tests.

## Tasks

### Task 1: Project Scripts and Ignore Rules

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Create project metadata**

Add scripts that use the local `node` binary selected by the caller:

```json
{
  "name": "interview-test",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "dev": "node src/server.js"
  }
}
```

- [ ] **Step 2: Add ignore rules**

Ignore `.DS_Store`, `node_modules`, `.env`, and generated coverage output.

- [ ] **Step 3: Add README**

Document:

- Run tests: `PATH=/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm test` if system npm works, or `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.js`.
- Run dev server: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/server.js`.
- Optional env: `OPENAI_API_KEY`, `OPENAI_MODEL`, `PORT`.

### Task 2: Validation and JSON Helpers

**Files:**
- Create: `tests/validation.test.js`
- Create: `tests/json.test.js`
- Create: `src/validation.js`
- Create: `src/json.js`

- [ ] **Step 1: Write failing validation tests**

Cover short resume rejection, missing target role rejection, and valid request normalization.

- [ ] **Step 2: Run validation tests and verify RED**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/validation.test.js`

Expected: FAIL because `src/validation.js` does not exist.

- [ ] **Step 3: Implement validation helpers**

Create `validateGenerateRequest(input)` and `validateFeedbackRequest(input)`.

- [ ] **Step 4: Write failing JSON tests**

Cover direct JSON parsing, fenced JSON extraction, surrounding-text JSON extraction, and invalid JSON error.

- [ ] **Step 5: Run JSON tests and verify RED**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/json.test.js`

Expected: FAIL because `src/json.js` does not exist.

- [ ] **Step 6: Implement JSON helper**

Create `parseJsonFromText(text)` that extracts the first JSON object or array from a model response.

- [ ] **Step 7: Run tests and verify GREEN**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/validation.test.js tests/json.test.js`

Expected: PASS.

### Task 3: Interview Service

**Files:**
- Create: `tests/interviewService.test.js`
- Create: `src/mockInterview.js`
- Create: `src/config.js`
- Create: `src/openaiClient.js`
- Create: `src/interviewService.js`

- [ ] **Step 1: Write failing service tests**

Cover:

- `generateInterview` returns a profile and at least 8 questions.
- Every generated question has a reference answer.
- `evaluateAnswer` returns score, feedback, improved answer, and follow-up.
- `createFinalReport` summarizes average score and weak areas.

- [ ] **Step 2: Run service tests and verify RED**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/interviewService.test.js`

Expected: FAIL because service modules do not exist.

- [ ] **Step 3: Implement mock interview data**

Create deterministic mock generation from resume keywords and target role so the app works without `OPENAI_API_KEY`.

- [ ] **Step 4: Implement OpenAI client**

Use `POST https://api.openai.com/v1/responses` with:

- `model`
- `instructions`
- `input`
- `text.format.type = "json_schema"`

Parse `output_text` when present, otherwise concatenate text parts from response output.

- [ ] **Step 5: Implement interview service**

Use OpenAI when an API key exists. Fall back to mock data when no key exists or when `USE_MOCK_LLM=true`.

- [ ] **Step 6: Run service tests and verify GREEN**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/interviewService.test.js`

Expected: PASS.

### Task 4: HTTP API and Static Server

**Files:**
- Create: `tests/server.test.js`
- Create: `src/server.js`

- [ ] **Step 1: Write failing server tests**

Cover:

- `GET /api/health` returns `{ "ok": true }`.
- `POST /api/generate` validates input and returns questions.
- `POST /api/evaluate` returns immediate feedback.
- `POST /api/report` returns final report.

- [ ] **Step 2: Run server tests and verify RED**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/server.test.js`

Expected: FAIL because `src/server.js` does not exist.

- [ ] **Step 3: Implement server**

Create routes:

- `GET /`
- `GET /api/health`
- `POST /api/generate`
- `POST /api/evaluate`
- `POST /api/report`
- static assets under `/public`

- [ ] **Step 4: Run server tests and verify GREEN**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/server.test.js`

Expected: PASS.

### Task 5: Frontend Experience

**Files:**
- Create: `public/index.html`
- Create: `public/styles.css`
- Create: `public/app.js`

- [ ] **Step 1: Build the app shell**

Create a single-screen work-focused interface with resume input, target role input, and interview workspace.

- [ ] **Step 2: Implement generation flow**

Call `/api/generate`, store `profile` and `questions`, and show the first question.

- [ ] **Step 3: Implement answer submission flow**

Before submission, hide the reference answer. After submission, call `/api/evaluate` and reveal reference answer plus feedback.

- [ ] **Step 4: Implement final report flow**

After all questions, call `/api/report` and show average score, strengths, weak areas, and practice suggestions.

### Task 6: Verification and Commit

**Files:**
- Modify: tracked implementation files.

- [ ] **Step 1: Run all tests**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.js`

Expected: PASS.

- [ ] **Step 2: Run server smoke check**

Run: `/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/server.js`

Open: `http://localhost:3000`

Expected: app loads and `/api/health` returns ok.

- [ ] **Step 3: Commit and push**

```bash
git add .
git commit -m "Build resume interview MVP"
git push
```

