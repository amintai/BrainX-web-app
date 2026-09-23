/**
 * Extracts a JSON substring from raw LLM text output that may be wrapped in
 * markdown code fences and/or surrounded by leading/trailing prose.
 * Returns the extracted string (still needs JSON.parse). When there is no
 * fence, the first balanced JSON object/array is located with a proper
 * bracket-depth scan (string-literal aware), and a clear error is thrown if
 * no balanced value can be found — it never silently returns a malformed or
 * wrong slice.
 */
export function extractJson(text) {
  if (typeof text !== 'string') {
    throw new TypeError('extractJson expects a string');
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    return fenced[1].trim();
  }

  // No fence: scan for the first complete, balanced JSON object/array,
  // tracking bracket depth and skipping over quoted-string contents (so
  // braces inside string literals, or stray braces in trailing prose,
  // never throw off the match).
  const trimmed = text.trim();
  const start = trimmed.search(/[[{]/);
  if (start === -1) {
    return trimmed;
  }

  const openers = { '{': '}', '[': ']' };
  const stack = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < trimmed.length; i += 1) {
    const char = trimmed[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(openers[char]);
      continue;
    }

    if (char === '}' || char === ']') {
      if (stack.length === 0 || stack[stack.length - 1] !== char) {
        throw new Error('extractJson: unbalanced JSON structure in AI output');
      }
      stack.pop();
      if (stack.length === 0) {
        return trimmed.slice(start, i + 1);
      }
    }
  }

  throw new Error('extractJson: no balanced JSON value found in AI output');
}
