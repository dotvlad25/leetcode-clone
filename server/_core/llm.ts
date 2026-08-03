import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";

/**
 * Provider-agnostic structured LLM call, used by the AI code review feature.
 *
 * Anthropic is preferred when ANTHROPIC_API_KEY is set; otherwise any
 * OpenAI-compatible endpoint (OpenAI, Ollama, LM Studio, …) is used via
 * OPENAI_API_KEY + OPENAI_BASE_URL. With neither key set the feature reports
 * itself as unconfigured instead of failing at request time.
 */
export type LLMProvider = "anthropic" | "openai";

export const LLM_NOT_CONFIGURED_MESSAGE =
  "AI code review is not configured. Add ANTHROPIC_API_KEY (or OPENAI_API_KEY) to your .env file and restart the server.";

export function getLLMProvider(): LLMProvider | null {
  if (ENV.anthropicApiKey) return "anthropic";
  if (ENV.openaiApiKey) return "openai";
  return null;
}

export function isLLMConfigured(): boolean {
  return getLLMProvider() !== null;
}

export type StructuredRequest = {
  system: string;
  user: string;
  /** Name for the response schema, surfaced to the provider. */
  schemaName: string;
  /** JSON Schema the response must conform to. Needs additionalProperties: false. */
  schema: Record<string, unknown>;
};

export class LLMNotConfiguredError extends Error {
  constructor() {
    super(LLM_NOT_CONFIGURED_MESSAGE);
    this.name = "LLMNotConfiguredError";
  }
}

/** Calls the configured provider and returns the parsed JSON response. */
export async function invokeStructuredLLM<T>(req: StructuredRequest): Promise<T> {
  const provider = getLLMProvider();
  if (!provider) throw new LLMNotConfiguredError();

  const raw = provider === "anthropic"
    ? await callAnthropic(req)
    : await callOpenAICompatible(req);

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`LLM returned a non-JSON response: ${raw.slice(0, 200)}`);
  }
}

// ── Anthropic ──────────────────────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: ENV.anthropicApiKey,
      baseURL: ENV.anthropicBaseUrl,
    });
  }
  return anthropicClient;
}

async function callAnthropic(req: StructuredRequest): Promise<string> {
  const response = await getAnthropicClient().messages.create({
    model: ENV.anthropicModel,
    max_tokens: 16000,
    system: req.system,
    messages: [{ role: "user", content: req.user }],
    output_config: {
      // A code review is a bounded task — medium keeps the Analyze button
      // responsive without giving up much review quality.
      effort: "medium",
      // Anthropic's json_schema format takes the schema only — the schema
      // name is an OpenAI-side concept.
      format: {
        type: "json_schema",
        schema: req.schema,
      },
    },
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to review this code.");
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map(block => block.text)
    .join("");

  if (!text) throw new Error("The model returned an empty response.");
  return text;
}

// ── OpenAI-compatible ──────────────────────────────────────────────────────

type ChatCompletion = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

async function callOpenAICompatible(req: StructuredRequest): Promise<string> {
  const url = `${ENV.openaiBaseUrl.replace(/\/+$/, "")}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: ENV.openaiModel,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: req.schemaName, strict: true, schema: req.schema },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LLM request failed: ${response.status} ${response.statusText} — ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as ChatCompletion;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("The model returned an empty response.");
  return content;
}
