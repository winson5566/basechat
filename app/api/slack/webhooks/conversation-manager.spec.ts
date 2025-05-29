import { randomUUID } from "crypto";

import { jest } from "@jest/globals";
import { GenericMessageEvent } from "@slack/web-api";
import { and, eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "@/lib/server/db/schema";

import { GenerateContext } from "../../conversations/[conversationId]/messages/utils";

import ConversationManager, { Retriever } from "./conversation-manager";
import Generator from "./generator";
import MessageDAO from "./message-dao";

class TestGenerator implements Generator {
  async generateObject(_context: GenerateContext) {
    return {
      usedSourceIndexes: [],
      message: "Test message",
    };
  }
}

let db: NodePgDatabase<typeof schema>;
let client: pg.Client;

beforeAll(async () => {
  client = new pg.Client({ connectionString: process.env.DATABASE_URL! });
  await client.connect();
  db = drizzle(client, { schema });
});

afterAll(async () => {
  await client.end();
});

async function createTestTenant(partial: Partial<typeof schema.tenants.$inferInsert> = {}) {
  const id = randomUUID();
  return (
    await db
      .insert(schema.tenants)
      .values({
        name: `example-${id}`,
        slug: `example-${id}`,
        trialExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        ...partial,
      })
      .returning()
  )[0];
}

async function createTestProfile(
  tenant: typeof schema.tenants.$inferSelect,
  user: typeof schema.users.$inferSelect,
  partial: Partial<typeof schema.profiles.$inferInsert> = {},
) {
  const id = randomUUID();
  return (
    await db
      .insert(schema.profiles)
      .values({
        tenantId: tenant.id,
        userId: user.id,
        role: "user",
        ...partial,
      })
      .returning()
  )[0];
}

async function createTestUser(partial: Partial<typeof schema.users.$inferInsert> = {}) {
  const id = randomUUID();
  return (
    await db
      .insert(schema.users)
      .values({
        ...partial,
      })
      .returning()
  )[0];
}

function createTestEvent(event: Partial<GenericMessageEvent> = {}): GenericMessageEvent {
  return {
    type: "message",
    subtype: undefined,
    event_ts: "123456789.123",
    channel_type: "channel",
    channel: "C123",
    user: "U123",
    text: "hello",
    ts: "123456789.123",
    ...event,
  };
}

describe("ConversationManager", () => {
  let tenant: typeof schema.tenants.$inferSelect;
  let profile: typeof schema.profiles.$inferSelect;
  let user: typeof schema.users.$inferSelect;
  let mockRetriever: Retriever;

  beforeEach(async () => {
    tenant = await createTestTenant();
    user = await createTestUser();
    profile = await createTestProfile(tenant, user, { role: "guest" });
    mockRetriever = jest.fn().mockResolvedValue({ content: "Retrieval system prompt", sources: [] });
  });

  describe("fromMessageEvent", () => {
    it("should create a ConversationManager instance", async () => {
      const event = createTestEvent();
      const manager = await ConversationManager.fromMessageEvent(tenant, profile, event, mockRetriever);
      expect(manager).toBeInstanceOf(ConversationManager);
    });

    describe("when a thread ID is not provided", () => {
      it("should create a new conversation", async () => {
        const event = createTestEvent({ thread_ts: undefined });
        const manager = await ConversationManager.fromMessageEvent(tenant, profile, event, mockRetriever);

        expect(manager.conversation).not.toBeNull();
        expect(manager.conversation.tenantId).toEqual(tenant.id);
        expect(manager.conversation.title).toEqual("Slack conversation");
        expect(manager.conversation.profileId).toEqual(profile.id);
        expect(manager.conversation.slackThreadId).toEqual(event.ts);
      });
    });

    describe("when a thread ID is provided", () => {
      describe("and the conversation does not exist", () => {
        it("should create a new conversation", async () => {
          const conversation = await db.query.conversations.findFirst({
            where: and(
              eq(schema.conversations.tenantId, tenant.id),
              eq(schema.conversations.profileId, profile.id),
              eq(schema.conversations.slackThreadId, "123456789.123"),
            ),
          });

          expect(conversation).toBeUndefined();

          const event = createTestEvent({ thread_ts: "123456789.123" });
          const manager = await ConversationManager.fromMessageEvent(tenant, profile, event, mockRetriever);

          expect(manager.conversation).not.toBeNull();
          expect(manager.conversation.tenantId).toEqual(tenant.id);
          expect(manager.conversation.title).toEqual("Slack conversation");
          expect(manager.conversation.profileId).toEqual(profile.id);
          expect(manager.conversation.slackThreadId).toEqual("123456789.123");
        });
      });

      describe("and the conversation exists", () => {
        it("should return the existing conversation", async () => {
          const conversation = (
            await db
              .insert(schema.conversations)
              .values({
                tenantId: tenant.id,
                profileId: profile.id,
                title: "Slack conversation",
                slackThreadId: "123456789.123",
              })
              .returning()
          )[0];

          const event = createTestEvent({ thread_ts: "123456789.123" });
          const manager = await ConversationManager.fromMessageEvent(tenant, profile, event, mockRetriever);
          expect(manager.conversation.id).toEqual(conversation.id);
        });
      });
    });
  });

  describe("add", () => {
    let conversation: typeof schema.conversations.$inferSelect;

    beforeEach(async () => {
      conversation = (
        await db
          .insert(schema.conversations)
          .values({
            tenantId: tenant.id,
            profileId: profile.id,
            title: "Slack conversation",
            slackThreadId: "123456789.123",
          })
          .returning()
      )[0];
    });

    describe("when the conversation has no messages", () => {
      beforeEach(async () => {
        const messages = await db.query.messages.findMany({
          where: eq(schema.messages.conversationId, conversation.id),
        });
        expect(messages).toHaveLength(0);
      });

      it("should add a system message and a user message to the conversation", async () => {
        const event = createTestEvent({ text: "hello" });
        const manager = new ConversationManager(
          tenant,
          new MessageDAO(tenant.id),
          conversation,
          new TestGenerator(),
          mockRetriever,
        );
        await manager.add(profile, event);

        const messages = await db.query.messages.findMany({
          where: eq(schema.messages.conversationId, conversation.id),
        });

        expect(messages).toHaveLength(3);

        expect(messages[0].role).toEqual("system");
        expect(messages[0].content).toContain("These are your instructions, they are very important to follow");

        expect(messages[1].role).toEqual("user");
        expect(messages[1].content).toEqual("hello");

        expect(messages[2].role).toEqual("system");
        expect(messages[2].content).toEqual("Retrieval system prompt");

        // TODO: Now that conversations are multi-user, we need to add a profileId to the message
        // expect(messages[1].profileId).toEqual(profile.id);
      });
    });

    describe("when the conversation has messages", () => {
      beforeEach(async () => {
        const event = createTestEvent({ text: "hello" });
        const manager = new ConversationManager(
          tenant,
          new MessageDAO(tenant.id),
          conversation,
          new TestGenerator(),
          mockRetriever,
        );
        await manager.add(profile, event);

        const messages = await db.query.messages.findMany({
          where: eq(schema.messages.conversationId, conversation.id),
        });
        expect(messages).toHaveLength(3);
      });

      it("should only add a user message to the conversation", async () => {
        const event = createTestEvent({ text: "hi hi" });

        const manager = new ConversationManager(
          tenant,
          new MessageDAO(tenant.id),
          conversation,
          new TestGenerator(),
          mockRetriever,
        );
        await manager.add(profile, event);

        const messages = await db.query.messages.findMany({
          where: eq(schema.messages.conversationId, conversation.id),
        });

        expect(messages).toHaveLength(5);

        expect(messages[0].role).toEqual("system");
        expect(messages[0].content).toContain("These are your instructions, they are very important to follow");

        expect(messages[1].role).toEqual("user");
        expect(messages[1].content).toEqual("hello");

        expect(messages[2].role).toEqual("system");
        expect(messages[2].content).toEqual("Retrieval system prompt");

        expect(messages[3].role).toEqual("user");
        expect(messages[3].content).toEqual("hi hi");

        expect(messages[4].role).toEqual("system");
        expect(messages[4].content).toEqual("Retrieval system prompt");
      });
    });
  });
});
