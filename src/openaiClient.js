import { parseJsonFromText } from "./json.js";

function extractOutputText(responseJson) {
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

export async function createJsonResponse({ apiKey, model, instructions, input, schema, fetchImpl = fetch }) {
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
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
  return parseJsonFromText(extractOutputText(responseJson));
}
