import assert from "assert";

import { openai } from "@ai-sdk/openai";
import { AllMessageEvents, GenericMessageEvent } from "@slack/web-api";
import { CoreMessage, generateObject } from "ai";
import assertNever from "assert-never";

import { createConversationMessageResponseSchema } from "@/lib/api";
import { DEFAULT_MODEL, DEFAULT_PROVIDER, getProviderForModel, SPECIAL_LLAMA_PROMPT } from "@/lib/llm/types";
import * as schema from "@/lib/server/db/schema";
import { createConversationMessage, updateConversationMessageContent } from "@/lib/server/service";

import {
  GenerateContext,
  getRetrievalSystemPrompt,
  renderGroundingSystemPrompt,
} from "../../conversations/[conversationId]/messages/utils";

import ConversationDAO from "./conversation-dao";
import MessageDAO from "./message-dao";

export type Retriever = (
  tenant: typeof schema.tenants.$inferSelect,
  query: string,
  isBreadth: boolean,
  rerankEnabled: boolean,
  prioritizeRecent: boolean,
) => Promise<{ content: string; sources: any[] }>;

const model = "gpt-4o";
export default class ConversationManager {
  public constructor(
    private readonly _tenant: typeof schema.tenants.$inferSelect,
    private readonly _messageDao: MessageDAO,
    private readonly _conversation: typeof schema.conversations.$inferSelect,
    private readonly _retriever?: Retriever,
  ) {
    if (!this._retriever) {
      this._retriever = getRetrievalSystemPrompt;
    }
  }

  get conversation() {
    return this._conversation;
  }

  async add(addedBy: typeof schema.profiles.$inferSelect, event: GenericMessageEvent) {
    if (event.subtype !== undefined) {
      throw new Error(`Message subtype ${event.subtype} is not supported`);
    }

    const existing = await this._messageDao.find({
      conversationId: this.conversation.id,
    });

    if (!existing.length) {
      await createConversationMessage({
        tenantId: this.conversation.tenantId,
        conversationId: this.conversation.id,
        role: "system",
        content: renderGroundingSystemPrompt({ company: { name: this._tenant.name } }, this._tenant.groundingPrompt),
        sources: [],
        model,
      });
    }

    await createConversationMessage({
      tenantId: this._tenant.id,
      conversationId: this.conversation.id,
      role: "user",
      content: event.text,
      sources: [],
      model,
    });

    assert(this._retriever, "Retriever is not set");

    const { content: systemMessageContent, sources } = await this._retriever(
      this._tenant,
      event.text ?? "",
      false,
      true,
      false,
    );

    await createConversationMessage({
      tenantId: this._tenant.id,
      conversationId: this.conversation.id,
      role: "system",
      content: systemMessageContent,
      sources,
      model,
    });
  }

  async generate(profile: typeof schema.profiles.$inferSelect) {
    const all = await this._messageDao.find({
      conversationId: this.conversation.id,
    });

    const messages: CoreMessage[] = all.map(({ role, content }) => {
      switch (role) {
        case "assistant":
          return { role: "assistant" as const, content: content ?? "" };
        case "user":
          return { role: "user" as const, content: content ?? "" };
        case "system":
          return { role: "system" as const, content: content ?? "" };
        default:
          assertNever(role);
      }
    });

    return await this._generate(this._tenant.id, profile.id, this.conversation.id, {
      messages,
      sources: [],
      model,
      isBreadth: false,
      rerankEnabled: true,
      prioritizeRecent: false,
    });
  }

  async _generate(tenantId: string, profileId: string, conversationId: string, context: GenerateContext) {
    // get provider given the model
    let provider = getProviderForModel(context.model);
    if (!provider) {
      console.log(`Provider not found for model ${context.model}`);
      console.log(`Using default model: ${DEFAULT_MODEL} and default provider: ${DEFAULT_PROVIDER}`);
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
      isBreadth: context.isBreadth,
      rerankEnabled: context.rerankEnabled,
      prioritizeRecent: context.prioritizeRecent,
    });

    const model = openai(context.model);

    const { object } = await generateObject({
      messages: context.messages,
      model,
      temperature: 0.3,
      system: provider === "groq" ? SPECIAL_LLAMA_PROMPT : undefined,
      output: "object",
      schema: createConversationMessageResponseSchema,
    });

    await updateConversationMessageContent(tenantId, profileId, conversationId, pendingMessage.id, object.message);

    return object;
  }

  static async fromMessageEvent(
    tenant: typeof schema.tenants.$inferSelect,
    profile: typeof schema.profiles.$inferSelect,
    event: AllMessageEvents,
    retriever?: Retriever,
  ) {
    if (event.subtype !== undefined) {
      throw new Error(`Message subtype ${event.subtype} is not supported`);
    }

    const dao = new ConversationDAO(tenant.id);
    let conversation: typeof schema.conversations.$inferSelect | undefined;

    if (event.thread_ts) {
      conversation = await dao.find({
        slackThreadId: event.thread_ts,
      });
      if (!conversation) {
        conversation = await dao.create({
          profileId: profile.id,
          title: "Slack conversation",
          slackThreadId: event.thread_ts,
        });
      }
    } else {
      conversation = await dao.create({
        profileId: profile.id,
        title: "Slack conversation",

        // Slack fields
        slackThreadId: event.ts,

        // TODO: Keep these fields?
        slackChannelId: event.channel,
        slackMessageId: event.ts,
        slackUserId: event.user,
      });
    }

    const manager = new ConversationManager(tenant, new MessageDAO(tenant.id), conversation, retriever);
    await manager.add(profile, event);
    return manager;
  }
}
