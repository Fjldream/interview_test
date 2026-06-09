import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getConfig } from "./config.js";
import { createFinalReport, evaluateAnswer, generateInterview } from "./interviewService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function safeStaticPath(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const resolved = path.resolve(publicDir, `.${decodeURIComponent(cleanPath)}`);
  return resolved.startsWith(publicDir) ? resolved : "";
}

async function serveStatic(request, response) {
  const url = new URL(request.url, "http://localhost");
  const filePath = safeStaticPath(url.pathname);

  if (!filePath) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

async function routeApi(request, response, config) {
  const url = new URL(request.url, "http://localhost");

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/config") {
    sendJson(response, 200, {
      provider: config.provider || "openai",
      model: config.model || config.openaiModel || "gpt-5-mini",
      hasApiKey: Boolean(config.apiKey || config.openaiApiKey),
      useMockLlm: Boolean(config.useMockLlm)
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/generate") {
    const body = await readJson(request);
    sendJson(response, 200, await generateInterview(body, { config }));
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/evaluate") {
    const body = await readJson(request);
    sendJson(response, 200, await evaluateAnswer(body, { config }));
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/report") {
    const body = await readJson(request);
    sendJson(response, 200, await createFinalReport(body, { config }));
    return true;
  }

  return false;
}

export function createAppServer(options = {}) {
  const config = options.config || getConfig();

  return createServer(async (request, response) => {
    try {
      if (await routeApi(request, response, config)) {
        return;
      }

      if (request.method === "GET") {
        await serveStatic(request, response);
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Request failed" });
    }
  });
}

if (process.argv[1] === __filename) {
  const config = getConfig();
  const server = createAppServer({ config });

  server.listen(config.port, () => {
    console.log(`简历模拟面试已启动：http://localhost:${config.port}`);
  });
}
