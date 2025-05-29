import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

import { createConversationMessageResponseSchema } from "@/lib/api";
import { DEFAULT_MODEL, DEFAULT_PROVIDER, getProviderForModel, SPECIAL_LLAMA_PROMPT } from "@/lib/llm/types";

import { GenerateContext } from "../../conversations/[conversationId]/messages/utils";

export interface Generator {
  generateObject(context: GenerateContext): Promise<{ usedSourceIndexes: number[]; message: string }>;
}

export class DefaultGenerator implements Generator {
  async generateObject(context: GenerateContext) {
    let provider = getProviderForModel(context.model);
    if (!provider) {
      console.log(`Provider not found for model ${context.model}`);
      console.log(`Using default model: ${DEFAULT_MODEL} and default provider: ${DEFAULT_PROVIDER}`);
      provider = DEFAULT_PROVIDER;
      context.model = DEFAULT_MODEL;
    }

    const model = openai(context.model);

    console.log("context.messages", context.messages);

    const { object } = await generateObject({
      messages: context.messages,
      model,
      temperature: 0.3,
      system: provider === "groq" ? SPECIAL_LLAMA_PROMPT : undefined,
      output: "object",
      schema: createConversationMessageResponseSchema,
    });

    return object;
  }
}

export default DefaultGenerator;
