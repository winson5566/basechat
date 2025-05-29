import assert from "assert";

import { AllMessageEvents, GenericMessageEvent } from "@slack/web-api";
import { CoreMessage } from "ai";
import assertNever from "assert-never";

import * as schema from "@/lib/server/db/schema";

import {
  getRetrievalSystemPrompt,
  renderGroundingSystemPrompt,
} from "../../conversations/[conversationId]/messages/utils";

import ConversationDAO from "./conversation-dao";
import BaseGenerator from "./generator";
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
    private readonly _generator: BaseGenerator,
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
      await this._messageDao.create({
        conversationId: this.conversation.id,
        role: "system",
        content: renderGroundingSystemPrompt({ company: { name: this._tenant.name } }, this._tenant.groundingPrompt),
        sources: [],
        model,
      });
    }

    await this._messageDao.create({
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

    await this._messageDao.create({
      conversationId: this.conversation.id,
      role: "system",
      content: systemMessageContent,
      sources,
      model,
    });
  }

  async generateObject() {
    const context = await this._getContext();
    const object = await this._generator.generateObject(context);

    await this._messageDao.create({
      conversationId: this.conversation.id,
      role: "assistant",
      content: object.message,
      sources: context.sources,
    });

    await this._messageDao.create({
      conversationId: this.conversation.id,
      role: "assistant",
      content: object.message,
      sources: context.sources,
      model: context.model,
      isBreadth: context.isBreadth,
      rerankEnabled: context.rerankEnabled,
      prioritizeRecent: context.prioritizeRecent,
    });

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

    const generator = new BaseGenerator();
    const manager = new ConversationManager(tenant, new MessageDAO(tenant.id), conversation, generator, retriever);
    await manager.add(profile, event);
    return manager;
  }

  private async _getContext() {
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

    return {
      messages,
      sources: [],
      model,
      isBreadth: false,
      rerankEnabled: true,
      prioritizeRecent: false,
    };
  }
}
