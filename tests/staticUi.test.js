import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("static UI resume upload", () => {
  it("provides a resume file input for text-based resumes", async () => {
    const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

    assert.match(html, /id="resumeFile"/);
    assert.match(html, /accept="\.txt,\.md,text\/plain,text\/markdown"/);
    assert.match(html, /上传简历文件/);
  });

  it("reads uploaded text files into the resume textarea", async () => {
    const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

    assert.match(app, /resumeFile/);
    assert.match(app, /handleResumeFile/);
    assert.match(app, /readAsText/);
    assert.match(app, /仅支持/);
  });
});
