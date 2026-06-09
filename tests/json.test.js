import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseJsonFromText } from "../src/json.js";

describe("parseJsonFromText", () => {
  it("parses direct JSON objects", () => {
    assert.deepEqual(parseJsonFromText('{"ok":true,"count":2}'), { ok: true, count: 2 });
  });

  it("extracts JSON from fenced code blocks", () => {
    const text = '```json\n{"questions":[{"id":"q1"}]}\n```';

    assert.deepEqual(parseJsonFromText(text), { questions: [{ id: "q1" }] });
  });

  it("extracts JSON arrays from surrounding text", () => {
    const text = 'Here is the result:\n[{"id":"q1"},{"id":"q2"}]\nThanks.';

    assert.deepEqual(parseJsonFromText(text), [{ id: "q1" }, { id: "q2" }]);
  });

  it("throws a useful error for invalid JSON text", () => {
    assert.throws(() => parseJsonFromText("not json at all"), /valid json/i);
  });
});
