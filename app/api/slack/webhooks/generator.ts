import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateObject, LanguageModel } from "ai";
import { assertNever } from "assert-never";

import { createConversationMessageResponseSchema } from "@/lib/api";
import { DEFAULT_PROVIDER, getProviderForModel, SPECIAL_LLAMA_PROMPT } from "@/lib/llm/types";

import { GenerateContext } from "../../conversations/[conversationId]/messages/utils";

export default interface Generator {
  generateObject(context: GenerateContext): Promise<{ usedSourceIndexes: number[]; message: string }>;
}

export function generatorFactory(model: string): Generator {
  const provider = getProviderForModel(model) ?? DEFAULT_PROVIDER;

  switch (provider) {
    case "openai":
      return new OpenAIGenerator();
    case "google":
      return new GoogleGenerator();
    case "anthropic":
      return new AnthropicGenerator();
    case "groq":
      return new GroqGenerator();
    default:
      assertNever(provider);
  }
}

export abstract class AbstractGenerator implements Generator {
  protected abstract _languageModelFactory(model: string): LanguageModel;

  protected _getSystem(): string | undefined {
    return undefined;
  }

  async generateObject(context: GenerateContext) {
    const model = this._languageModelFactory(context.model);

    const messages = context.messages.filter((msg) => {
      if (!msg.content) return false;
      if (typeof msg.content === "string" && msg.content.trim() === "") return false;
      return true;
    });

    const { object } = await generateObject({
      messages,
      model,
      temperature: 0.3,
      system: this._getSystem(),
      output: "object",
      schema: createConversationMessageResponseSchema,
    });

    return object;
  }
}
export abstract class SortedMessageGenerator extends AbstractGenerator {
  async generateObject(context: GenerateContext) {
    const systemMessages = context.messages.filter((msg) => msg.role === "system");
    const nonSystemMessages = context.messages.filter((msg) => msg.role !== "system");

    return super.generateObject({
      ...context,
      messages: [...systemMessages, ...nonSystemMessages],
    });
  }
}

export class AnthropicGenerator extends SortedMessageGenerator {
  _languageModelFactory = (model: string) => anthropic(model);
}

export class GoogleGenerator extends SortedMessageGenerator {
  _languageModelFactory = (model: string) => google(model);
}

export class GroqGenerator extends AbstractGenerator {
  _languageModelFactory = (model: string) => groq(model);

  protected _getSystem = () => SPECIAL_LLAMA_PROMPT;
}

export class OpenAIGenerator extends AbstractGenerator {
  _languageModelFactory = (model: string) => openai(model);
}
