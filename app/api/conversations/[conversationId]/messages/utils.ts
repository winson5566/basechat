import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, streamObject } from "ai";
import Handlebars from "handlebars";

import { createConversationMessageResponseSchema } from "@/lib/api";
import { DEFAULT_GROUNDING_PROMPT, DEFAULT_SYSTEM_PROMPT } from "@/lib/constants";
import { LLMModel, DEFAULT_MODEL, DEFAULT_PROVIDER, getProviderForModel } from "@/lib/llm/types";
import { getRagieClient } from "@/lib/server/ragie";
import { createConversationMessage, updateConversationMessageContent } from "@/lib/server/service";

type GenerateContext = { messages: CoreMessage[]; sources: any[]; model: LLMModel };

export async function generate(tenantId: string, profileId: string, conversationId: string, context: GenerateContext) {
  // get provider given the model
  let provider = getProviderForModel(context.model);
  if (!provider) {
    console.log(`Provider not found for model ${context.model}`);
    console.log(`Using default provider: ${DEFAULT_PROVIDER} and default model: ${DEFAULT_MODEL}`);
    provider = DEFAULT_PROVIDER;
    context.model = DEFAULT_MODEL;
  }

  const pendingMessage = await createConversationMessage({
    tenantId,
    conversationId,
    role: "assistant",
    content: null,
    sources: context.sources,
    model: context.model,
    provider: provider,
  });

  // Move system messages to the beginning for providers that require it
  const systemMessages = context.messages.filter((msg) => msg.role === "system");
  const nonSystemMessages = context.messages.filter((msg) => msg.role !== "system");
  context.messages = [...systemMessages, ...nonSystemMessages];

  let model;
  switch (provider) {
    case "openai":
      model = openai(context.model);
      break;
    case "google":
      model = google(context.model);
      break;
    case "anthropic":
      model = anthropic(context.model);
      break;
    default:
      model = openai(DEFAULT_MODEL);
  }

  let result;
  try {
    result = await streamObject({
      messages: context.messages,
      model,
      temperature: 0.3,
      schema: createConversationMessageResponseSchema,
      onFinish: async (event) => {
        if (!event.object) {
          console.log("No object in event");
          return;
        }

        await updateConversationMessageContent(
          tenantId,
          profileId,
          conversationId,
          pendingMessage.id,
          event.object.message,
        );
      },
      onError: (error) => {
        console.error("Stream error:", error);
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
  return [result, pendingMessage.id] as const;
}

export async function getRetrievalSystemPrompt(tenantId: string, name: string, query: string) {
  const response = await getRagieClient().retrievals.retrieve({
    partition: tenantId,
    query,
    topK: 6,
    rerank: true,
  });

  console.log(`ragie response includes ${response.scoredChunks.length} chunk(s)`);

  const chunks = JSON.stringify(response);

  const sources = response.scoredChunks.map((chunk) => ({
    ...chunk.documentMetadata,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
  }));

  return {
    content: getSystemPrompt({
      company: { name },
      chunks,
    }),
    sources,
  };
}

export type GroundingSystemPromptContext = {
  company: {
    name: string;
  };
};

export type SystemPromptContext = {
  company: {
    name: string;
  };
  chunks: string;
};

export function getGroundingSystemPrompt(context: GroundingSystemPromptContext, prompt?: string | null) {
  const groundingPrompt = prompt ? prompt : DEFAULT_GROUNDING_PROMPT;

  const template = Handlebars.compile(groundingPrompt);

  const now = new Date().toISOString();
  return template({ ...context, now });
}

function getSystemPrompt(context: SystemPromptContext, prompt?: string | null) {
  const systemPrompt = prompt ? prompt : DEFAULT_SYSTEM_PROMPT;

  const template = Handlebars.compile(systemPrompt);

  return template({ ...context });
}
