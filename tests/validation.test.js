import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  validateFeedbackRequest,
  validateGenerateRequest
} from "../src/validation.js";

describe("validateGenerateRequest", () => {
  it("rejects resume text that is too short", () => {
    assert.throws(
      () => validateGenerateRequest({ resumeText: "Java", targetRole: "后端开发工程师" }),
      /简历内容至少需要 80 个字符/
    );
  });

  it("rejects missing target role", () => {
    assert.throws(
      () =>
        validateGenerateRequest({
          resumeText:
            "Experienced backend engineer with Java, Spring Boot, Redis, MySQL, distributed systems, order systems, and payment integrations."
        }),
      /请填写目标岗位/
    );
  });

  it("normalizes valid generate request fields", () => {
    const result = validateGenerateRequest({
      resumeText:
        "  Experienced backend engineer with Java, Spring Boot, Redis, MySQL, distributed systems, order systems, and payment integrations.  ",
      targetRole: "  后端开发工程师  "
    });

    assert.equal(result.resumeText.startsWith("Experienced"), true);
    assert.equal(result.targetRole, "后端开发工程师");
  });
});

describe("validateFeedbackRequest", () => {
  it("rejects empty candidate answers", () => {
    assert.throws(
      () =>
        validateFeedbackRequest({
          question: { id: "q1", question: "Explain Redis caching.", reference_answer: "Discuss cache strategy." },
          candidateAnswer: " "
        }),
      /请先填写你的回答/
    );
  });

  it("accepts a complete feedback request", () => {
    const result = validateFeedbackRequest({
      question: {
        id: "q1",
        question: "Explain Redis caching.",
        intent: "Check cache design",
        reference_answer: "Discuss cache strategy."
      },
      candidateAnswer: "I used Redis to reduce repeated database reads and added expiration rules."
    });

    assert.equal(result.question.id, "q1");
    assert.equal(result.candidateAnswer.includes("Redis"), true);
  });
});
