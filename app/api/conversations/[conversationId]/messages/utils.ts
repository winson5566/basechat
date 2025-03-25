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
    provider = DEFAULT_PROVIDER;
  }

  console.log(`Using provider: ${provider} with model: ${context.model}`);

  const pendingMessage = await createConversationMessage({
    tenantId,
    conversationId,
    role: "assistant",
    content: null,
    sources: context.sources,
    model: context.model,
    provider: provider,
  });

  let model;
  switch (provider) {
    case "openai":
      model = openai(context.model);
      break;
    case "google":
      model = google(context.model);

      // Move system messages to the beginning for Google models
      const systemMessages = context.messages.filter((msg) => msg.role === "system");
      const nonSystemMessages = context.messages.filter((msg) => msg.role !== "system");
      context.messages = [...systemMessages, ...nonSystemMessages];
      break;
    case "anthropic":
      model = anthropic(context.model);
      console.log("Initialized Anthropic model:", model);
      break;
    default:
      model = openai(context.model);
  }

  console.log(model);
  let result;
  try {
    console.log("Starting streamObject with model:", {
      provider,
      model: context.model,
      messageCount: context.messages.length,
      temperature: 0.3,
      messageTypes: context.messages.map((m) => m.role),
    });
    result = await streamObject({
      messages: context.messages,
      model,
      temperature: 0.3,
      schema: createConversationMessageResponseSchema,
      onFinish: async (event) => {
        console.log("Stream finished with event:", event);
        if (!event.object) {
          console.log("No object in event");
          return;
        }

        console.log("Event object:", event.object);
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
    console.error("Error streaming object:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }

  console.log("result", result);
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
