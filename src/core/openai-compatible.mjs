export function providerDefaults(provider) {
  if (provider === "openrouter") {
    return {
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openai/gpt-4.1-mini"
    };
  }

  return {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini"
  };
}

export function buildChatCompletionsRequest({
  provider = "openai-compatible",
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.4
}) {
  const defaults = providerDefaults(provider);
  const resolvedBaseUrl = (baseUrl || defaults.baseUrl).replace(/\/$/, "");
  const resolvedModel = model || defaults.model;

  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Missing BYOK API key.");
  }

  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`
  };

  if (provider === "openrouter") {
    headers["http-referer"] = "http://localhost/deburapy";
    headers["x-title"] = "Deburapy";
  }

  return {
    url: `${resolvedBaseUrl}/chat/completions`,
    headers,
    body: {
      model: resolvedModel,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    }
  };
}

export async function generateChatCompletion(input) {
  const request = buildChatCompletionsRequest(input);
  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(request.body)
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.error?.message || response.statusText;
    throw new Error(`Provider request failed: ${detail}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Provider returned no assistant content.");
  }

  return content;
}
