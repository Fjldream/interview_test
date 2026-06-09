function stripFence(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function findJsonSlice(text) {
  const start = text.search(/[\[{]/);
  if (start === -1) {
    return "";
  }

  const opener = text[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = inString;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === opener) {
      depth += 1;
    }

    if (char === closer) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return "";
}

export function parseJsonFromText(text) {
  if (typeof text !== "string") {
    throw new Error("Expected model output to be a string containing valid JSON.");
  }

  const unfenced = stripFence(text);
  const candidates = [unfenced, findJsonSlice(unfenced)].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next extraction strategy.
    }
  }

  throw new Error("Model output did not contain valid JSON.");
}
