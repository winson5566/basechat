import { z } from "zod";

// Single source of truth for search settings configuration
export const SEARCH_SETTINGS_CONFIG = {
  breadth: {
    id: "breadth",
    displayName: "Breadth vs Depth",
    description: "Searches a wider range of documents for a broader response (slower)",
    defaultValue: false,
    defaultOverridable: true,
  },
  rerank: {
    id: "rerank",
    displayName: "Rerank Results",
    description: "Reranks search results for better relevance",
    defaultValue: false,
    defaultOverridable: true,
  },
  recencyBias: {
    id: "recencyBias",
    displayName: "Prioritize Recent Data",
    description: "Gives higher priority to more recent documents",
    defaultValue: false,
    defaultOverridable: true,
  },
} as const;

// Type for all setting IDs
export type SearchSettingId = keyof typeof SEARCH_SETTINGS_CONFIG;

// Helper to get all setting IDs
export const ALL_SEARCH_SETTINGS = Object.keys(SEARCH_SETTINGS_CONFIG) as SearchSettingId[];

// Map setting IDs to their database column names
export const SETTING_TO_COLUMN_MAP = {
  breadth: "isBreadth",
  rerank: "rerankEnabled",
  recencyBias: "prioritizeRecent",
} as const;

// Map setting IDs to their override column names
export const SETTING_TO_OVERRIDE_COLUMN_MAP = {
  breadth: "overrideBreadth",
  rerank: "overrideRerank",
  recencyBias: "overridePrioritizeRecent",
} as const;

// Zod schema for search settings validation
export const searchSettingsSchema = z.object({
  id: z.string(),
  isBreadth: z.boolean(),
  rerankEnabled: z.boolean(),
  prioritizeRecent: z.boolean(),
  overrideBreadth: z.boolean(),
  overrideRerank: z.boolean(),
  overridePrioritizeRecent: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Schema for updating search settings
export const updateSearchSettingsSchema = z.object({
  isBreadth: z.boolean().optional(),
  rerankEnabled: z.boolean().optional(),
  prioritizeRecent: z.boolean().optional(),
  overrideBreadth: z.boolean().optional(),
  overrideRerank: z.boolean().optional(),
  overridePrioritizeRecent: z.boolean().optional(),
});

export type SearchSettings = z.infer<typeof searchSettingsSchema>;
export type UpdateSearchSettingsRequest = z.infer<typeof updateSearchSettingsSchema>;

// Helper to get default values for all settings
export function getDefaultSearchSettings() {
  return {
    isBreadth: SEARCH_SETTINGS_CONFIG.breadth.defaultValue,
    rerankEnabled: SEARCH_SETTINGS_CONFIG.rerank.defaultValue,
    prioritizeRecent: SEARCH_SETTINGS_CONFIG.recencyBias.defaultValue,
    overrideBreadth: SEARCH_SETTINGS_CONFIG.breadth.defaultOverridable,
    overrideRerank: SEARCH_SETTINGS_CONFIG.rerank.defaultOverridable,
    overridePrioritizeRecent: SEARCH_SETTINGS_CONFIG.recencyBias.defaultOverridable,
  };
}

// Helper to check if a setting can be overridden
export function canOverrideSetting(settings: SearchSettings, settingId: SearchSettingId): boolean {
  const overrideColumn = SETTING_TO_OVERRIDE_COLUMN_MAP[settingId];
  return settings[overrideColumn];
}

// Helper to get display information for a setting
export function getSettingDisplayInfo(settingId: SearchSettingId) {
  const config = SEARCH_SETTINGS_CONFIG[settingId];
  return {
    displayName: config.displayName,
    description: config.description,
  };
}
