import assert from "assert";

import { and, asc, eq } from "drizzle-orm";

import db from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function createConversationMessage(message: typeof schema.messages.$inferInsert) {
  const rs = await db
    .insert(schema.messages)
    .values({
      tenantId: message.tenantId,
      role: message.role,
      conversationId: message.conversationId,
      content: message.content,
      sources: message.sources,
    })
    .returning();
  assert(rs.length === 1);
  return rs[0];
}

export async function updateConversationMessageContent(
  tenantId: string,
  profileId: string,
  conversationId: string,
  messageId: string,
  content: string,
) {
  return await db
    .update(schema.messages)
    .set({ content })
    .where(
      and(
        eq(schema.messages.tenantId, tenantId),
        eq(schema.messages.conversationId, conversationId),
        eq(schema.messages.id, messageId),
      ),
    );
}

export async function getConversation(tenantId: string, profileId: string, conversationId: string) {
  const rs = await db
    .select()
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.tenantId, tenantId),
        eq(schema.conversations.profileId, profileId),
        eq(schema.conversations.id, conversationId),
      ),
    );
  assert(rs.length === 1);
  return rs[0];
}

export async function getConversationMessage(
  tenantId: string,
  profileId: string,
  conversationId: string,
  messageId: string,
) {
  const rs = await db
    .select()
    .from(schema.messages)
    .innerJoin(schema.conversations, eq(schema.messages.conversationId, schema.conversations.id))
    .where(
      and(
        eq(schema.messages.tenantId, tenantId),
        eq(schema.messages.conversationId, conversationId),
        eq(schema.messages.id, messageId),
        eq(schema.conversations.profileId, profileId),
      ),
    );
  assert(rs.length === 1);
  return rs[0].messages;
}

export async function getConversationMessages(tenantId: string, profileId: string, conversationId: string) {
  const rs = await db
    .select()
    .from(schema.messages)
    .innerJoin(schema.conversations, eq(schema.messages.conversationId, schema.conversations.id))
    .where(
      and(
        eq(schema.messages.tenantId, tenantId),
        eq(schema.messages.conversationId, conversationId),
        eq(schema.conversations.profileId, profileId),
      ),
    )
    .orderBy(asc(schema.messages.createdAt));
  return rs.map((r) => r.messages);
}
