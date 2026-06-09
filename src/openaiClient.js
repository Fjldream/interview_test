import { parseJsonFromText } from "./json.js";

function extractOpenAIOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") {
    return responseJson.output_text;
  }

  const parts = [];
  for (const item of responseJson.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n");
}

function extractDeepSeekOutputText(responseJson) {
  return responseJson.choices?.[0]?.message?.content || "";
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function createSignal(timeoutMs) {
  const timeout = Number(timeoutMs || 0);
  return timeout > 0 && typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(timeout) : undefined;
}

function isRetryableDeepSeekError(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError") {
    return true;
  }

  if (error?.status >= 500) {
    return true;
  }

  return error?.message?.includes("fetch failed") || error?.cause?.code === "UND_ERR_HEADERS_TIMEOUT";
}

function createProviderError(error, model, fallbackModel = "") {
  if (fallbackModel) {
    return new Error(`DeepSeek 生成超时，已尝试备用模型 ${fallbackModel}，但仍未返回。请稍后重试。`);
  }

  if (isRetryableDeepSeekError(error)) {
    return new Error(`DeepSeek 模型 ${model} 响应较慢或暂时不可用，请稍后重试。`);
  }

  return error;
}

async function createDeepSeekJsonResponse({ apiKey, baseUrl, model, instructions, input, fetchImpl, timeoutMs }) {
  const response = await fetchImpl(`${trimTrailingSlash(baseUrl || "https://api.deepseek.com")}/chat/completions`, {
    method: "POST",
    signal: createSignal(timeoutMs),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: input }
      ],
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
      max_tokens: 3500,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`DeepSeek request failed: ${response.status} ${errorText}`);
    error.status = response.status;
    throw error;
  }

  const responseJson = await response.json();
  return parseJsonFromText(extractDeepSeekOutputText(responseJson));
}

async function createOpenAIJsonResponse({ apiKey, baseUrl, model, instructions, input, schema, fetchImpl }) {
  const response = await fetchImpl(`${trimTrailingSlash(baseUrl || "https://api.openai.com/v1")}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      text: {
        format: {
          type: "json_schema",
          name: schema.name,
          schema: schema.schema,
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const responseJson = await response.json();
  return parseJsonFromText(extractOpenAIOutputText(responseJson));
}

export async function createJsonResponse({
  provider = "openai",
  apiKey,
  baseUrl,
  model,
  fallbackModel,
  timeoutMs,
  instructions,
  input,
  schema,
  fetchImpl = fetch
}) {
  if (provider === "deepseek") {
    try {
      return await createDeepSeekJsonResponse({ apiKey, baseUrl, model, instructions, input, fetchImpl, timeoutMs });
    } catch (error) {
      const canFallback = fallbackModel && fallbackModel !== model && isRetryableDeepSeekError(error);
      if (!canFallback) {
        throw createProviderError(error, model);
      }

      try {
        return await createDeepSeekJsonResponse({ apiKey, baseUrl, model: fallbackModel, instructions, input, fetchImpl, timeoutMs });
      } catch (fallbackError) {
        throw createProviderError(fallbackError, model, fallbackModel);
      }
    }
  }

  return createOpenAIJsonResponse({ apiKey, baseUrl, model, instructions, input, schema, fetchImpl });
}
