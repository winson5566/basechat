import { z } from "zod";

import { LLMModel, ALL_VALID_MODELS } from "@/lib/llm/types";

export const createConversationMessageResponseSchema = z.object({
  usedSourceIndexes: z.array(z.number().describe("The indexes of the sources used in the response")),
  message: z.string().describe("The response message"),
});

export const createConversationMessageRequestSchema = z.object({
  conversationId: z.string(),
  content: z.string().describe("The request message"),
  model: z.enum(ALL_VALID_MODELS as [LLMModel, ...LLMModel[]]).describe("The LLM model to use"),
  isBreadth: z.boolean().describe("Whether to use breadth-first search"),
  rerankEnabled: z.boolean().describe("Whether to rerank results"),
  prioritizeRecent: z.boolean().describe("Whether to prioritize recent data"),
});

export type CreateConversationMessageRequest = z.infer<typeof createConversationMessageRequestSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const conversationListResponseSchema = z.array(conversationSchema);

export const conversationMessagesResponseSchema = z.array(
  z.union([
    z.object({
      id: z.string(),
      content: z.string(),
      role: z.literal("assistant"),
      sources: z.array(z.any()).default([]),
      expanded: z.boolean().default(false),
      model: z.enum(ALL_VALID_MODELS as [LLMModel, ...LLMModel[]]),
    }),
    z.object({
      id: z.string(),
      content: z.string(),
      role: z.literal("user"),
    }),
    z.object({
      id: z.string(),
      content: z.string(),
      role: z.literal("system"),
    }),
  ]),
);

export const updateTenantSchema = z.object({
  question1: z.string(),
  question2: z.string(),
  question3: z.string(),
  groundingPrompt: z.string().nullable(),
  systemPrompt: z.string().nullable(),
  welcomeMessage: z.string().nullable(),
  slug: z.string(),
  isPublic: z.boolean(),
  name: z.string(),
});

export type MemberType = "profile" | "invite";
export type MemberRole = "admin" | "user" | "guest";

export interface Member {
  id: string;
  email: string | null;
  name: string | null;
  role: MemberRole;
  type: MemberType;
}

export const createTenantResponseSchema = z.object({
  id: z.string(),
});

export const tenantListResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().nullable(),
    userCount: z.number().nullable(),
  }),
);

export const updateCurrentProfileSchema = z.object({
  tenantId: z.string(),
});

export const setupSchema = z.object({
  tenant: z.object({
    id: z.string(),
    slug: z.string(),
  }),
  profile: z.object({
    id: z.string(),
  }),
});
