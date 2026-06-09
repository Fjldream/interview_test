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
    assert.equal(capturedBody.messages[0].role, "system");
    assert.deepEqual(result, { ok: true });
  });
});
