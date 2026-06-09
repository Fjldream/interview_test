import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("desktop shell", () => {
  it("defines Electron desktop scripts and entry", async () => {
    const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

    assert.equal(pkg.main, "desktop/main.cjs");
    assert.match(pkg.scripts.desktop, /node_modules\/electron\/cli\.js desktop\/main\.cjs/);
    assert.match(pkg.scripts["desktop:mock"], /USE_MOCK_LLM=true .*node_modules\/electron\/cli\.js desktop\/main\.cjs/);
  });

  it("starts the existing interview server from Electron", async () => {
    const main = await readFile(new URL("../desktop/main.cjs", import.meta.url), "utf8");

    assert.match(main, /createAppServer/);
    assert.match(main, /BrowserWindow/);
    assert.match(main, /loadURL/);
  });
});

describe("Chinese voice input UI", () => {
  it("adds a voice input button near the answer box", async () => {
    const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

    assert.match(html, /id="voiceButton"/);
    assert.match(html, /语音输入/);
    assert.match(html, /id="voiceStatus"/);
  });

  it("uses browser speech recognition with Chinese locale when available", async () => {
    const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

    assert.match(app, /SpeechRecognition|webkitSpeechRecognition/);
    assert.match(app, /zh-CN/);
    assert.match(app, /startVoiceInput/);
    assert.match(app, /stopVoiceInput/);
  });
});

describe("desktop layout polish", () => {
  it("keeps the empty state compact instead of filling the whole viewport", async () => {
    const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

    assert.doesNotMatch(css, /min-height:\s*calc\(100vh - 56px\)/);
    assert.match(css, /\.empty-state[\s\S]*min-height:\s*220px/);
  });
});
