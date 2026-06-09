export function getConfig(env = process.env) {
  return {
    port: Number(env.PORT || 3000),
    openaiApiKey: env.OPENAI_API_KEY || "",
    openaiModel: env.OPENAI_MODEL || "gpt-5-mini",
    useMockLlm: env.USE_MOCK_LLM === "true"
  };
}
