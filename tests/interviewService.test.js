import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createFinalReport,
  evaluateAnswer,
  generateInterview
} from "../src/interviewService.js";

const resumeText =
  "后端开发工程师，4 年经验，主要使用 Java、Spring Boot、Redis、MySQL。负责订单系统、支付回调、缓存优化、消息队列消费、接口性能优化和生产问题排查。";
const mockConfig = { openaiApiKey: "", openaiModel: "gpt-5-mini", useMockLlm: true };

describe("generateInterview", () => {
  it("returns a candidate profile and at least 8 resume-specific questions", async () => {
    const result = await generateInterview({ resumeText, targetRole: "后端开发工程师" }, { config: mockConfig });

    assert.equal(result.profile.target_role, "后端开发工程师");
    assert.ok(result.profile.skills.length >= 3);
    assert.ok(result.questions.length >= 8);
    assert.equal(result.questions.every((question) => question.reference_answer), true);
    assert.equal(result.questions.every((question) => question.intent), true);
    assert.match(result.questions[0].question, /简历|项目|负责|问题/);
    assert.match(result.questions[0].reference_answer, /优秀|回答|背景/);
  });
});

describe("evaluateAnswer", () => {
  it("returns immediate feedback for a submitted answer", async () => {
    const interview = await generateInterview({ resumeText, targetRole: "后端开发工程师" }, { config: mockConfig });
    const feedback = await evaluateAnswer({
      question: interview.questions[0],
      candidateAnswer: "我使用 Redis 缓存降低数据库读取压力，设置过期时间，并关注热点订单数据。"
    }, { config: mockConfig });

    assert.equal(typeof feedback.score, "number");
    assert.ok(feedback.score >= 0 && feedback.score <= 10);
    assert.ok(feedback.strengths.length > 0);
    assert.ok(feedback.weaknesses.length > 0);
    assert.ok(feedback.improved_answer.includes("Redis") || feedback.improved_answer.includes("缓存"));
    assert.ok(feedback.follow_up_question.endsWith("？"));
  });
});

describe("createFinalReport", () => {
  it("summarizes average score and weak areas", async () => {
    const report = await createFinalReport({
      targetRole: "后端开发工程师",
      answers: [
        {
          question: { question: "解释 Redis 缓存一致性。" },
          feedback: {
            score: 6,
            strengths: ["业务背景清楚"],
            weaknesses: ["缺少一致性策略"]
          }
        },
        {
          question: { question: "解释 MySQL 索引。" },
          feedback: {
            score: 8,
            strengths: ["索引解释清楚"],
            weaknesses: ["缺少量化数据"]
          }
        }
      ]
    });

    assert.equal(report.average_score, 7);
    assert.ok(report.weak_areas.includes("缺少一致性策略"));
    assert.ok(report.practice_suggestions.length > 0);
    assert.match(report.practice_suggestions[0], /准备|练习|项目/);
  });
});
