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

export async function getConversationMessage(tenantId: string, conversationId: string, messageId: string) {
  const rs = await db
    .select()
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.tenantId, tenantId),
        eq(schema.messages.conversationId, conversationId),
        eq(schema.messages.id, messageId),
      ),
    );
  assert(rs.length === 1);
  return rs[0];
}

export async function getConversationMessages(tenantId: string, conversationId: string) {
  return await db
    .select()
    .from(schema.messages)
    .where(and(eq(schema.messages.tenantId, tenantId), eq(schema.messages.conversationId, conversationId)))
    .orderBy(asc(schema.messages.createdAt));
}
