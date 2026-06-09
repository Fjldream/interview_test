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

async function createDeepSeekJsonResponse({ apiKey, baseUrl, model, instructions, input, fetchImpl }) {
  const response = await fetchImpl(`${trimTrailingSlash(baseUrl || "https://api.deepseek.com")}/chat/completions`, {
    method: "POST",
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
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek request failed: ${response.status} ${errorText}`);
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

export async function createJsonResponse({ provider = "openai", apiKey, baseUrl, model, instructions, input, schema, fetchImpl = fetch }) {
  if (provider === "deepseek") {
    return createDeepSeekJsonResponse({ apiKey, baseUrl, model, instructions, input, fetchImpl });
  }

  return createOpenAIJsonResponse({ apiKey, baseUrl, model, instructions, input, schema, fetchImpl });
}
