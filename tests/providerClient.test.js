import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createJsonResponse } from "../src/openaiClient.js";

describe("createJsonResponse provider routing", () => {
  it("calls DeepSeek chat completions with JSON mode", async () => {
    let capturedUrl = "";
    let capturedBody = null;
    const fetchImpl = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"ok":true}' } }]
        })
      };
    };

    const result = await createJsonResponse({
      provider: "deepseek",
      apiKey: "test-key",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-pro",
      instructions: "只返回 JSON。",
      input: "生成结果。",
      schema: { name: "test", schema: { type: "object" } },
      fetchImpl
    });

    assert.equal(capturedUrl, "https://api.deepseek.com/chat/completions");
    assert.equal(capturedBody.model, "deepseek-v4-pro");
    assert.equal(capturedBody.response_format.type, "json_object");
    assert.equal(capturedBody.thinking.type, "disabled");
    assert.equal(capturedBody.messages[0].role, "system");
    assert.deepEqual(result, { ok: true });
  });

  it("falls back to DeepSeek flash when the primary model times out", async () => {
    const models = [];
    const fetchImpl = async (url, options) => {
      models.push(JSON.parse(options.body).model);
      if (models.length === 1) {
        const error = new Error("timed out");
        error.name = "TimeoutError";
        throw error;
      }

      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"ok":true,"model":"flash"}' } }]
        })
      };
    };

    const result = await createJsonResponse({
      provider: "deepseek",
      apiKey: "test-key",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-pro",
      fallbackModel: "deepseek-v4-flash",
      timeoutMs: 10,
      instructions: "只返回 JSON。",
      input: "生成结果。",
      schema: { name: "test", schema: { type: "object" } },
      fetchImpl
    });

    assert.deepEqual(models, ["deepseek-v4-pro", "deepseek-v4-flash"]);
    assert.deepEqual(result, { ok: true, model: "flash" });
  });
});
