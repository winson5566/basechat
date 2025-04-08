import { z } from "zod";

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
  groq: {
    models: ["meta-llama/llama-4-scout-17b-16e-instruct"] as const,
    logo: "/openai.svg", // TODO: add logo
    displayNames: {
      "meta-llama/llama-4-scout-17b-16e-instruct": "Llama 4 Scout 17B",
    } as const,
  },
  deepseek: {
    models: ["deepseek-chat"] as const,
    logo: "/gemini.svg", // TODO: add logo
    displayNames: {
      "deepseek-chat": "DeepSeek V3",
    } as const,
  },
} as const;

// Default values
// If adding a new provider, update app/api/conversations/[conversationId]/messages/utils.ts using the vercel ai-sdk
// If changing the DEFAULT_NAMING_MODEL, update createConversationName in app/api/conversations/[conversationId]/messages/utils.ts to use appropriate provider
export const DEFAULT_MODEL = "claude-3-7-sonnet-latest";
export const DEFAULT_PROVIDER = "anthropic";
export const DEFAULT_NAMING_MODEL = "gpt-4o-mini";

// Derive types from the config
export type LLMProvider = keyof typeof PROVIDER_CONFIG;

// List of all currently valid model names for validation
export const ALL_VALID_MODELS = Object.values(PROVIDER_CONFIG).flatMap((config) => config.models) as string[];

// Create Zod schema for model validation
export const modelSchema = z.enum(ALL_VALID_MODELS as [string, ...string[]]);

// Type for validated model names
export type LLMModel = z.infer<typeof modelSchema>;

// Schema for array of models (used for enabledModels)
export const modelArraySchema = z.array(modelSchema).min(1, "At least one model must be enabled").nullable();

// Helper function to get enabled models, handling null case
export function getEnabledModels(enabledModels: string[] | null): string[] {
  if (enabledModels === null) {
    return ALL_VALID_MODELS;
  }
  // Filter out any models that aren't in ALL_VALID_MODELS
  return enabledModels.filter((model) => ALL_VALID_MODELS.includes(model));
}

export function getProviderForModel(model: string): LLMProvider | null {
  // Validate the model first
  const parsed = modelSchema.safeParse(model);
  if (!parsed.success) return null;

  for (const [provider, config] of Object.entries(PROVIDER_CONFIG)) {
    if ((config.models as readonly string[]).includes(model)) {
      return provider as LLMProvider;
    }
  }
  return null;
}

// Logo and display name mappings
export const LLM_LOGO_MAP = Object.fromEntries(
  ALL_VALID_MODELS.map((model) => {
    const provider = getProviderForModel(model);
    return [model, [model, provider ? PROVIDER_CONFIG[provider].logo : ""]];
  }),
) as Record<LLMModel, [string, string]>;

export const LLM_DISPLAY_NAMES = Object.fromEntries(
  ALL_VALID_MODELS.map((model) => {
    const provider = getProviderForModel(model);
    return [
      model,
      provider &&
      PROVIDER_CONFIG[provider].displayNames[model as keyof (typeof PROVIDER_CONFIG)[typeof provider]["displayNames"]]
        ? PROVIDER_CONFIG[provider].displayNames[
            model as keyof (typeof PROVIDER_CONFIG)[typeof provider]["displayNames"]
          ]
        : model,
    ];
  }),
) as Record<LLMModel, string>;
