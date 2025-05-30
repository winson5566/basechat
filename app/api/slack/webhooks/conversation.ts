import assert from "assert";

import { AllMessageEvents, GenericMessageEvent } from "@slack/web-api";
import { CoreMessage } from "ai";
import assertNever from "assert-never";

import * as schema from "@/lib/server/db/schema";

import {
  FAILED_MESSAGE_CONTENT,
  getRetrievalSystemPrompt,
  renderGroundingSystemPrompt,
} from "../../conversations/[conversationId]/messages/utils";

import ConversationDAO from "./conversation-dao";
import AbstractGenerator, { generatorFactory } from "./generator";
import MessageDAO from "./message-dao";

interface RetrieverSettings {
  isBreadth: boolean;
  rerankEnabled: boolean;
  prioritizeRecent: boolean;
}

export interface ReplyContext {
  conversationId: string;
  messages: CoreMessage[];
  sources: any[];
}
export class Retriever {
  constructor(
    private readonly _tenant: typeof schema.tenants.$inferSelect,
    private readonly _settings: RetrieverSettings,
  ) {}

  get isBreadth() {
    return this._settings.isBreadth;
  }
  get rerankEnabled() {
    return this._settings.rerankEnabled;
  }
  get prioritizeRecent() {
    return this._settings.prioritizeRecent;
  }

  async retrieve(query: string) {
    return getRetrievalSystemPrompt(
      this._tenant,
      query,
      this._settings.isBreadth,
      this._settings.rerankEnabled,
      this._settings.prioritizeRecent,
    );
  }
}
export default class ConversationContext {
  public constructor(
    private readonly _messageDao: MessageDAO,
    private readonly _retriever: Retriever,
    private readonly _tenant: typeof schema.tenants.$inferSelect,
    private readonly _conversation: typeof schema.conversations.$inferSelect,
  ) {}

  get conversation() {
    return this._conversation;
  }

  promptSlackMessage(addedBy: typeof schema.profiles.$inferSelect, event: GenericMessageEvent) {
    if (event.subtype !== undefined) {
      throw new Error(`Message subtype ${event.subtype} is not supported`);
    }

    return this.prompt(addedBy, event.text ?? "");
  }

  async prompt(addedBy: typeof schema.profiles.$inferSelect, content: string): Promise<ReplyContext> {
    const existing = await this._messageDao.find({
      conversationId: this._conversation.id,
    });

    if (!existing.length) {
      await this._messageDao.create({
        conversationId: this._conversation.id,
        role: "system",
        content: renderGroundingSystemPrompt({ company: { name: this._tenant.name } }, this._tenant.groundingPrompt),
        sources: [],
      });
    }

    const message = await this._messageDao.create({
      conversationId: this._conversation.id,
      role: "user",
      content,
      sources: [],
    });

    const { content: systemMessageContent, sources } = await this._retriever.retrieve(content);

    await this._messageDao.create({
      conversationId: this._conversation.id,
      role: "system",
      content: systemMessageContent,
      sources,
      isBreadth: this._retriever.isBreadth,
      rerankEnabled: this._retriever.rerankEnabled,
      prioritizeRecent: this._retriever.prioritizeRecent,
    });

    return this._getContext(sources);
  }

  private async _getContext(sources: any[]): Promise<ReplyContext> {
    const all = await this._messageDao.find({
      conversationId: this._conversation.id,
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
          return assertNever(role);
      }
    });

    return {
      conversationId: this._conversation.id,
      messages,
      sources,
    };
  }

  static async fromMessageEvent(
    tenant: typeof schema.tenants.$inferSelect,
    profile: typeof schema.profiles.$inferSelect,
    event: AllMessageEvents,
    retriever: Retriever,
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

    return new ConversationContext(new MessageDAO(tenant.id), retriever, tenant, conversation);
  }
}

export class ReplyGenerator {
  constructor(
    private readonly _messageDao: MessageDAO,
    private readonly _generator: AbstractGenerator,
  ) {}

  async generateObject(context: ReplyContext) {
    const object = await this._generator.generateObject({
      messages: context.messages,
    });

    await this._messageDao.create({
      conversationId: context.conversationId,
      role: "assistant",
      content: object.message,
      sources: context.sources,
      model: this._generator.model,
    });

    return object;
  }

  async generateStream(context: ReplyContext) {
    const pending = await this._messageDao.create({
      conversationId: context.conversationId,
      role: "assistant",
      content: null,
      sources: context.sources,
      model: this._generator.model,
    });

    try {
      const stream = this._generator.generateStream(context, {
        onFinish: async (event) => {
          if (!event.object) {
            await this._messageDao.update(pending.id, {
              content: FAILED_MESSAGE_CONTENT,
            });
            return;
          }
          await this._messageDao.update(pending.id, {
            content: (event.object as any).message,
          });
        },
      });
      return [stream, pending.id] as const;
    } catch (error) {
      await this._messageDao.update(pending.id, {
        content: FAILED_MESSAGE_CONTENT,
      });
      return [null, pending.id] as const;
    }
  }
}
