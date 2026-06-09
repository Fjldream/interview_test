import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createAppServer } from "../src/server.js";

const resumeText =
  "后端开发工程师，4 年经验，主要使用 Java、Spring Boot、Redis、MySQL。负责订单系统、支付回调、缓存优化、消息队列消费、接口性能优化和生产问题排查。";

let server;
let baseUrl;

async function postJson(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { response, body: await response.json() };
}

before(async () => {
  server = createAppServer({ config: { openaiApiKey: "", openaiModel: "gpt-5-mini", useMockLlm: true } });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("server routes", () => {
  it("returns health status", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
  });

  it("generates interview questions", async () => {
    const { response, body } = await postJson("/api/generate", {
      resumeText,
      targetRole: "后端开发工程师"
    });

    assert.equal(response.status, 200);
    assert.equal(body.questions.length >= 8, true);
    assert.equal(Boolean(body.questions[0].reference_answer), true);
  });

  it("evaluates a submitted answer", async () => {
    const generated = await postJson("/api/generate", {
      resumeText,
      targetRole: "后端开发工程师"
    });
    const { response, body } = await postJson("/api/evaluate", {
      question: generated.body.questions[0],
      candidateAnswer: "我使用 Redis 缓存降低数据库读取压力，并设置了过期规则。"
    });

    assert.equal(response.status, 200);
    assert.equal(typeof body.score, "number");
    assert.ok(body.improved_answer.length > 0);
  });

  it("creates a final report", async () => {
    const { response, body } = await postJson("/api/report", {
      targetRole: "后端开发工程师",
      answers: [
        {
          feedback: {
            score: 7,
            strengths: ["背景清楚"],
            weaknesses: ["需要补充指标"]
          }
        }
      ]
    });

    assert.equal(response.status, 200);
    assert.equal(body.average_score, 7);
    assert.ok(body.practice_suggestions.length > 0);
  });
});
