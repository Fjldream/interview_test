import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createFinalReport,
  evaluateAnswer,
  generateInterview,
  normalizeAnswerFeedback,
  normalizeInterviewQuestions
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

describe("DeepSeek response normalization", () => {
  it("normalizes common DeepSeek question field names", () => {
    const questions = normalizeInterviewQuestions([
      {
        question: "请讲讲 Redis 缓存设计。",
        standardAnswer: "应该说明缓存策略、一致性和异常场景。",
        criteria: "考察缓存设计能力。",
        followUp: "如何保证缓存和数据库一致？"
      }
    ]);

    assert.equal(questions[0].id, "q1");
    assert.equal(questions[0].reference_answer, "应该说明缓存策略、一致性和异常场景。");
    assert.deepEqual(questions[0].scoring_rubric, ["考察缓存设计能力。"]);
    assert.deepEqual(questions[0].follow_up_questions, ["如何保证缓存和数据库一致？"]);
  });

  it("normalizes common DeepSeek feedback field names", () => {
    const feedback = normalizeAnswerFeedback({
      score: 8,
      highlights: ["讲到了缓存策略"],
      missingPoints: ["缺少量化指标"],
      improvedAnswer: "可以补充命中率和延迟变化。",
      followUp: "缓存失效时怎么办？"
    });

    assert.equal(feedback.score, 8);
    assert.deepEqual(feedback.strengths, ["讲到了缓存策略"]);
    assert.deepEqual(feedback.weaknesses, ["缺少量化指标"]);
    assert.equal(feedback.improved_answer, "可以补充命中率和延迟变化。");
    assert.equal(feedback.follow_up_question, "缓存失效时怎么办？");
  });
});

describe("LLM interview generation", () => {
  it("generates profile and questions in one provider call", async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  profile: {
                    target_role: "后端开发工程师",
                    seniority: "4 年",
                    skills: ["Java", "Redis"],
                    projects: [],
                    risk_points: ["需要补充指标"]
                  },
                  questions: [
                    {
                      question: "请讲讲 Redis 缓存优化。",
                      standardAnswer: "需要说明背景、方案和结果。",
                      criteria: "考察缓存设计。",
                      followUp: "如何保证一致性？"
                    }
                  ]
                })
              }
            }
          ]
        })
      };
    };

    const result = await generateInterview(
      { resumeText, targetRole: "后端开发工程师" },
      {
        config: {
          provider: "deepseek",
          apiKey: "test-key",
          baseUrl: "https://api.deepseek.com",
          model: "deepseek-v4-pro",
          useMockLlm: false
        },
        fetchImpl
      }
    );

    assert.equal(calls, 1);
    assert.equal(result.profile.target_role, "后端开发工程师");
    assert.equal(result.questions[0].reference_answer, "需要说明背景、方案和结果。");
  });
});
