import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createFinalReport,
  evaluateAnswer,
  generateInterview
} from "../src/interviewService.js";

const resumeText =
  "Backend engineer with 4 years of experience building Java Spring Boot services. " +
  "Worked on an order system, Redis caching, MySQL performance tuning, payment callbacks, " +
  "message queues, distributed locks, monitoring, and production incident handling.";
const mockConfig = { openaiApiKey: "", openaiModel: "gpt-5-mini", useMockLlm: true };

describe("generateInterview", () => {
  it("returns a candidate profile and at least 8 resume-specific questions", async () => {
    const result = await generateInterview({ resumeText, targetRole: "Backend Engineer" }, { config: mockConfig });

    assert.equal(result.profile.target_role, "Backend Engineer");
    assert.ok(result.profile.skills.length >= 3);
    assert.ok(result.questions.length >= 8);
    assert.equal(result.questions.every((question) => question.reference_answer), true);
    assert.equal(result.questions.every((question) => question.intent), true);
  });
});

describe("evaluateAnswer", () => {
  it("returns immediate feedback for a submitted answer", async () => {
    const interview = await generateInterview({ resumeText, targetRole: "Backend Engineer" }, { config: mockConfig });
    const feedback = await evaluateAnswer({
      question: interview.questions[0],
      candidateAnswer: "I used Redis cache to reduce database reads and set expiration for hot order data."
    }, { config: mockConfig });

    assert.equal(typeof feedback.score, "number");
    assert.ok(feedback.score >= 0 && feedback.score <= 10);
    assert.ok(feedback.strengths.length > 0);
    assert.ok(feedback.weaknesses.length > 0);
    assert.ok(feedback.improved_answer.includes("Redis") || feedback.improved_answer.includes("cache"));
    assert.ok(feedback.follow_up_question.endsWith("?"));
  });
});

describe("createFinalReport", () => {
  it("summarizes average score and weak areas", async () => {
    const report = await createFinalReport({
      targetRole: "Backend Engineer",
      answers: [
        {
          question: { question: "Explain Redis cache consistency." },
          feedback: {
            score: 6,
            strengths: ["Clear business context"],
            weaknesses: ["Missing consistency strategy"]
          }
        },
        {
          question: { question: "Explain MySQL indexing." },
          feedback: {
            score: 8,
            strengths: ["Good index explanation"],
            weaknesses: ["Missing measurement data"]
          }
        }
      ]
    });

    assert.equal(report.average_score, 7);
    assert.ok(report.weak_areas.includes("Missing consistency strategy"));
    assert.ok(report.practice_suggestions.length > 0);
  });
});
