import {
  AIImageInput,
  AIProvider,
  AIProviderConfig,
  AIStructuredGenerationRequest,
  DEFAULT_PROVIDER_CONFIGS,
} from "./types";

export function getDefaultBaseUrl(provider: AIProviderConfig["provider"]): string {
  return DEFAULT_PROVIDER_CONFIGS[provider].baseUrl;
}

export function getDefaultModel(provider: AIProviderConfig["provider"]): string {
  return DEFAULT_PROVIDER_CONFIGS[provider].model;
}

export type OpenAIMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: OpenAIMessageContent;
}

export async function callOpenAICompatible(
  config: AIProviderConfig,
  messages: OpenAIMessage[],
  jsonMode = true
): Promise<string> {
  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl || getDefaultBaseUrl(config.provider);
  const model = config.model || getDefaultModel(config.provider);

  if (!apiKey) {
    throw new Error(`${config.provider} API key is not set`);
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.2,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${config.provider} API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error(`Empty response from ${config.provider}`);

  return content;
}

function buildOpenAIUserMessage(
  prompt: string,
  images?: AIImageInput[]
): OpenAIMessage {
  if (!images || images.length === 0) {
    return { role: "user", content: prompt };
  }

  const content: OpenAIMessageContent = [
    { type: "text", text: prompt },
    ...images.map((img) => ({
      type: "image_url" as const,
      image_url: { url: `data:${img.mimeType};base64,${img.base64Data}` },
    })),
  ];

  return { role: "user", content };
}

function createOpenAICompatibleProvider(
  config: AIProviderConfig
): AIProvider {
  const systemMessage: OpenAIMessage = {
    role: "system",
    content:
      "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.",
  };

  return {
    async generate(prompt: string): Promise<string> {
      const content = await callOpenAICompatible(config, [
        systemMessage,
        { role: "user", content: prompt },
      ]);
      return extractJson(content);
    },
    async generateWithImages(
      prompt: string,
      images: AIImageInput[]
    ): Promise<string> {
      const content = await callOpenAICompatible(
        config,
        [systemMessage, buildOpenAIUserMessage(prompt, images)],
        true
      );
      return extractJson(content);
    },
    async generateStructuredObject(
      request: AIStructuredGenerationRequest
    ): Promise<string> {
      const content = await callOpenAICompatible(
        config,
        [systemMessage, buildOpenAIUserMessage(request.prompt, request.images)],
        true
      );
      return extractJson(content);
    },
  };
}

export function createOpenAIProvider(config: AIProviderConfig): AIProvider {
  return createOpenAICompatibleProvider({
    ...config,
    baseUrl: config.baseUrl || getDefaultBaseUrl("openai"),
    model: config.model || getDefaultModel("openai"),
  });
}

export function createDeepSeekProvider(config: AIProviderConfig): AIProvider {
  return createOpenAICompatibleProvider({
    ...config,
    baseUrl: config.baseUrl || getDefaultBaseUrl("deepseek"),
    model: config.model || getDefaultModel("deepseek"),
  });
}

export function createKimiProvider(config: AIProviderConfig): AIProvider {
  return createOpenAICompatibleProvider({
    ...config,
    baseUrl: config.baseUrl || getDefaultBaseUrl("kimi"),
    model: config.model || getDefaultModel("kimi"),
  });
}

export function createOpenRouterProvider(
  config: AIProviderConfig
): AIProvider {
  return createOpenAICompatibleProvider({
    ...config,
    baseUrl: config.baseUrl || getDefaultBaseUrl("openrouter"),
    model: config.model || getDefaultModel("openrouter"),
  });
}

export function createSiliconFlowProvider(
  config: AIProviderConfig
): AIProvider {
  return createOpenAICompatibleProvider({
    ...config,
    baseUrl: config.baseUrl || getDefaultBaseUrl("siliconflow"),
    model: config.model || getDefaultModel("siliconflow"),
  });
}

export function createCustomProvider(config: AIProviderConfig): AIProvider {
  if (!config.baseUrl) {
    throw new Error("Custom provider requires a base URL");
  }
  if (!config.model) {
    throw new Error("Custom provider requires a model");
  }
  return createOpenAICompatibleProvider(config);
}

export function createAnthropicProvider(config: AIProviderConfig): AIProvider {
  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl || getDefaultBaseUrl("anthropic");
  const model = config.model || getDefaultModel("anthropic");

  const systemPrompt =
    "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.";

  async function generateText(prompt: string): Promise<string> {
    if (!apiKey) {
      throw new Error("Anthropic API key is not set");
    }

    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      content: { type: string; text: string }[];
    };

    const text = data.content.find((c) => c.type === "text")?.text;
    if (!text) throw new Error("Empty response from Anthropic");

    return extractJson(text);
  }

  async function generateWithImagesText(
    prompt: string,
    images: AIImageInput[]
  ): Promise<string> {
    if (!apiKey) {
      throw new Error("Anthropic API key is not set");
    }

    const content = [
      ...images.map((img) => ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: img.mimeType as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data: img.base64Data,
        },
      })),
      { type: "text" as const, text: prompt },
    ];

    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      content: { type: string; text: string }[];
    };

    const text = data.content.find((c) => c.type === "text")?.text;
    if (!text) throw new Error("Empty response from Anthropic");

    return extractJson(text);
  }

  return {
    generate: generateText,
    generateWithImages: generateWithImagesText,
    async generateStructuredObject(
      request: AIStructuredGenerationRequest
    ): Promise<string> {
      if (request.images && request.images.length > 0) {
        return generateWithImagesText(request.prompt, request.images);
      }
      return generateText(request.prompt);
    },
  };
}

export function createGeminiProvider(config: AIProviderConfig): AIProvider {
  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl || getDefaultBaseUrl("gemini");
  const model = config.model || getDefaultModel("gemini");

  async function generateText(prompt: string): Promise<string> {
    if (!apiKey) {
      throw new Error("Gemini API key is not set");
    }

    const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
      }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini");

    return extractJson(text);
  }

  async function generateWithImagesText(
    prompt: string,
    images: AIImageInput[]
  ): Promise<string> {
    if (!apiKey) {
      throw new Error("Gemini API key is not set");
    }

    const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.\n\n${prompt}`,
              },
              ...images.map((img) => ({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.base64Data,
                },
              })),
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
      }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini");

    return extractJson(text);
  }

  return {
    generate: generateText,
    generateWithImages: generateWithImagesText,
    async generateStructuredObject(
      request: AIStructuredGenerationRequest
    ): Promise<string> {
      if (request.images && request.images.length > 0) {
        return generateWithImagesText(request.prompt, request.images);
      }
      return generateText(request.prompt);
    },
  };
}

export function createOllamaProvider(config: AIProviderConfig): AIProvider {
  const baseUrl = config.baseUrl || getDefaultBaseUrl("ollama");
  const model = config.model || getDefaultModel("ollama");

  async function generateText(prompt: string): Promise<string> {
    if (!model) {
      throw new Error("Ollama model is not set");
    }

    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.",
          },
          { role: "user", content: prompt },
        ],
        stream: false,
        format: "json",
        options: { temperature: 0.2 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };

    const content = data.message?.content;
    if (!content) throw new Error("Empty response from Ollama");

    return extractJson(content);
  }

  async function generateWithImagesText(
    prompt: string,
    images: AIImageInput[]
  ): Promise<string> {
    if (!model) {
      throw new Error("Ollama model is not set");
    }

    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a structured understanding engine for a personal life OS. Respond only with valid JSON matching the requested shape.",
          },
          { role: "user", content: prompt },
        ],
        images: images.map((img) => img.base64Data),
        stream: false,
        format: "json",
        options: { temperature: 0.2 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };

    const content = data.message?.content;
    if (!content) throw new Error("Empty response from Ollama");

    return extractJson(content);
  }

  return {
    generate: generateText,
    generateWithImages: generateWithImagesText,
    async generateStructuredObject(
      request: AIStructuredGenerationRequest
    ): Promise<string> {
      if (request.images && request.images.length > 0) {
        return generateWithImagesText(request.prompt, request.images);
      }
      return generateText(request.prompt);
    },
  };
}

export function extractJson(text: string): string {
  const cleaned = text.trim();

  // Prefer fenced json blocks.
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }

  // Find the outermost balanced JSON object or array.
  let firstBrace = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{" || cleaned[i] === "[") {
      firstBrace = i;
      break;
    }
  }
  if (firstBrace === -1) return cleaned;

  const openChar = cleaned[firstBrace];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = firstBrace; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return cleaned.slice(firstBrace, i + 1);
      }
    }
  }

  // Fallback: return from first brace to end if unable to balance.
  return cleaned.slice(firstBrace);
}
