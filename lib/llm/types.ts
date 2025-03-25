// Single source of truth for providers and their models
export const PROVIDER_CONFIG = {
  openai: {
    models: ["gpt-4o", "gpt-3.5-turbo"] as const,
    logo: "/openai.svg",
    displayNames: {
      "gpt-4o": "GPT-4o",
      "gpt-3.5-turbo": "GPT-3.5 Turbo",
    } as const,
  },
  google: {
    models: ["gemini-2.0-flash", "gemini-1.5-pro"] as const,
    logo: "/gemini.svg",
    displayNames: {
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "gemini-1.5-pro": "Gemini 1.5 Pro",
    } as const,
  },
  anthropic: {
    models: ["claude-3-7-sonnet-latest", "claude-3-5-haiku-latest"] as const,
    logo: "/anthropic.svg",
    displayNames: {
      "claude-3-7-sonnet-latest": "Claude 3.7 Sonnet",
      "claude-3-5-haiku-latest": "Claude 3.5 Haiku",
    } as const,
  },
} as const;

// Default values
export const DEFAULT_MODEL = "gpt-4o";
export const DEFAULT_PROVIDER = "openai";

// Derive types from the config
export type LLMProvider = keyof typeof PROVIDER_CONFIG;
export type LLMModel = (typeof PROVIDER_CONFIG)[LLMProvider]["models"][number];
export type ProviderModels<T extends LLMProvider> = (typeof PROVIDER_CONFIG)[T]["models"][number];

// Runtime mappings
export const PROVIDER_MODELS = {
  openai: PROVIDER_CONFIG.openai.models,
  google: PROVIDER_CONFIG.google.models,
  anthropic: PROVIDER_CONFIG.anthropic.models,
} as const;

export const ALL_VALID_MODELS = Object.values(PROVIDER_CONFIG).flatMap((config) => config.models) as LLMModel[];

export function getProviderForModel(model: LLMModel): LLMProvider | null {
  for (const [provider, config] of Object.entries(PROVIDER_CONFIG)) {
    if ((config.models as readonly string[]).includes(model)) {
      return provider as LLMProvider;
    }
  }
  return null;
}

// Logo mapping
export const LLM_LOGO_MAP = Object.fromEntries(
  ALL_VALID_MODELS.map((model) => [model, [model, PROVIDER_CONFIG[getProviderForModel(model)!].logo]]),
) as Record<LLMModel, [string, string]>;

// Display name mapping
export const LLM_DISPLAY_NAMES = Object.fromEntries(
  ALL_VALID_MODELS.map((model) => {
    const provider = getProviderForModel(model)!;
    return [
      model,
      PROVIDER_CONFIG[provider].displayNames[model as keyof (typeof PROVIDER_CONFIG)[typeof provider]["displayNames"]],
    ];
  }),
) as unknown as Record<LLMModel, string>;
