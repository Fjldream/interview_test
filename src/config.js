import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv(env) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return env;
  }

  const loaded = { ...env };
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (loaded[key] === undefined) {
      loaded[key] = valueParts.join("=").trim();
    }
  }

  return loaded;
}

export function getConfig(env = process.env) {
  const mergedEnv = loadDotEnv(env);
  const provider = (mergedEnv.LLM_PROVIDER || (mergedEnv.DEEPSEEK_API_KEY ? "deepseek" : "openai")).toLowerCase();
  const deepseekApiKey = mergedEnv.DEEPSEEK_API_KEY || "";
  const openaiApiKey = mergedEnv.OPENAI_API_KEY || "";

  return {
    port: Number(mergedEnv.PORT || 3000),
    provider,
    apiKey: provider === "deepseek" ? deepseekApiKey : openaiApiKey,
    baseUrl: provider === "deepseek" ? mergedEnv.DEEPSEEK_BASE_URL || "https://api.deepseek.com" : mergedEnv.OPENAI_BASE_URL || "https://api.openai.com/v1",
    model: provider === "deepseek" ? mergedEnv.DEEPSEEK_MODEL || "deepseek-v4-pro" : mergedEnv.OPENAI_MODEL || "gpt-5-mini",
    openaiApiKey,
    openaiModel: mergedEnv.OPENAI_MODEL || "gpt-5-mini",
    useMockLlm: mergedEnv.USE_MOCK_LLM === "true"
  };
}
