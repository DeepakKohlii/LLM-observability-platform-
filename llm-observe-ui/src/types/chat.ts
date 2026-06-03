export type ProviderId =
  | "openai"
  | "openrouter"
  | "groq"
  | "anthropic"
  | "custom";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  defaultModel: string;
  models: string[];
  placeholder: string;
  docsUrl: string;
  needsCustomUrl?: boolean;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    defaultModel: "openai/gpt-4o-mini",
    models: [
      "openai/gpt-4o-mini",
      "openai/gpt-4o",
      "meta-llama/llama-3.1-8b-instruct:free",
    ],
    placeholder: "sk-or-...",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "groq",
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
    placeholder: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ],
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    defaultModel: "your-model",
    models: [],
    placeholder: "your-api-key",
    docsUrl: "",
    needsCustomUrl: true,
  },
];

export interface ChatSettings {
  provider: ProviderId;
  apiKey: string;
  model: string;
  customBaseUrl: string;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  provider: "openrouter",
  apiKey: "",
  model: "openai/gpt-4o-mini",
  customBaseUrl: "",
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  meta?: {
    model: string;
    latency_ms: number;
    cost_usd: number;
  };
}

export interface ChatResponse {
  response: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cost_usd: number;
}
