import { AllMessageEvents, GenericMessageEvent } from "@slack/web-api";

import * as schema from "@/lib/server/db/schema";

import ConversationDAO from "./conversation-dao";

export default class ConversationManager {
  private constructor(
    private readonly _dao: ConversationDAO,
    private readonly _conversation: typeof schema.conversations.$inferSelect,
  ) {}

  get conversation() {
    return this._conversation;
  }

  async add(event: GenericMessageEvent) {
    if (event.subtype !== undefined) {
      throw new Error(`Message subtype ${event.subtype} is not supported`);
    }
  }

  async generate() {
    return null;
  }

  static async fromMessageEvent(tenantId: string, profileId: string, event: AllMessageEvents) {
    if (event.subtype !== undefined) {
      throw new Error(`Message subtype ${event.subtype} is not supported`);
    }

    const dao = new ConversationDAO(tenantId);
    let conversation: typeof schema.conversations.$inferSelect | undefined;

    if (event.thread_ts) {
      conversation = await dao.find({
        slackThreadId: event.thread_ts,
      });
      if (!conversation) {
        conversation = await dao.create({
          profileId: profileId,
          title: "Slack conversation",
          slackThreadId: event.thread_ts,
        });
      }
    } else {
      conversation = await dao.create({
        profileId: profileId,
        title: "Slack conversation",

        // Slack fields
        slackThreadId: event.ts,

        // TODO: Keep these fields?
        slackChannelId: event.channel,
        slackMessageId: event.ts,
        slackUserId: event.user,
      });
    }

    const manager = new ConversationManager(dao, conversation);
    // await manager.add(event);
    return manager;
  }
}
