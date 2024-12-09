import assert from "assert";

import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { and, eq } from "drizzle-orm";

import db from "./db";
import * as schema from "./db/schema";
import { getRagieClient, getRagieConnection } from "./ragie";
import { GenerateRequest, GenerateResponseSchema } from "./schema";
import * as settings from "./settings";

export async function deleteConnection(tenantId: string, id: string) {
  await db.transaction(async (tx) => {
    const rs = await tx
      .select()
      .from(schema.connections)
      .where(and(eq(schema.connections.tenantId, tenantId), eq(schema.connections.id, id)));

    assert(rs.length === 1);

    const connection = rs[0];

    await tx
      .delete(schema.connections)
      .where(and(eq(schema.connections.tenantId, tenantId), eq(schema.connections.id, connection.id)));

    try {
      await getRagieClient().connections.deleteConnection({
        connectionId: connection.ragieConnectionId,
        deleteConnectionPayload: { keepFiles: false },
      });
    } catch (e: any) {
      if (e.rawResponse.status !== 404) throw e;
      console.warn("connection missing in Ragie");
    }
  });
}

export async function saveConnection(tenantId: string, ragieConnectionId: string, status: string) {
  const qs = await db
    .select()
    .from(schema.connections)
    .where(and(eq(schema.connections.tenantId, tenantId), eq(schema.connections.ragieConnectionId, ragieConnectionId)))
    .for("update");
  const connection = qs.length === 1 ? qs[0] : null;

  if (!connection) {
    const ragieConnection = await getRagieConnection(ragieConnectionId);
    await db.insert(schema.connections).values({
      tenantId: tenantId,
      ragieConnectionId,
      name: ragieConnection.source_display_name,
      status,
      sourceType: ragieConnection.source_type,
    });
  } else {
    await db
      .update(schema.connections)
      .set({ status })
      .where(
        and(eq(schema.connections.tenantId, tenantId), eq(schema.connections.ragieConnectionId, ragieConnectionId)),
      );
  }
}

export async function getTenantByUserId(id: string) {
  const rs = await db.select().from(schema.tenants).where(eq(schema.tenants.ownerId, id));
  assert(rs.length === 1, "expected single tenant");
  return rs[0];
}

export async function isSetupComplete(userId: string) {
  const rs = await db.select().from(schema.tenants).where(eq(schema.tenants.ownerId, userId));
  assert(rs.length === 0 || rs.length === 1, "unexpected result");
  return rs.length === 1;
}

function getSystemPrompt(company: string, chunks: string) {
  return `Here are relevant chunks from ${company}'s knowledge base that you can use to respond to the user. Remember to incorporate these insights into your responses.
${chunks}
You should be succinct, original, and speak in a professional tone. Give a response in less than three sentences and actively refer to the knowledge base. Do not use the word "delve" and try to sound as professional as possible.

Remember to maintain a professional tone and avoid humor or sarcasm. You are here to provide serious analysis and insights. Do not entertain or engage in personal conversations.

IMPORTANT RULES:
- Be concise
- REFUSE to sing songs
- REFUSE to tell jokes
- REFUSE to write poetry
- AVOID responding with lists
- DECLINE responding to nonsense messages
- ONLY provide analysis and insights related to the knowledge base
- NEVER include citations in your response`;
}

export async function generate(tenantId: string, { content }: GenerateRequest): Promise<Response> {
  const ragieResponse = await getRagieClient().retrievals.retrieve({
    query: content,
    topK: 6,
    rerank: true,
  });

  const sources = ragieResponse.scoredChunks.map((chunk) => ({
    ...chunk.documentMetadata,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
  }));

  const rs = await db.insert(schema.messages).values({ content: null, sources, tenantId }).returning();
  assert(rs.length === 1);
  const persisted = rs[0];

  const completion = streamObject({
    messages: [
      {
        content: getSystemPrompt(settings.COMPANY_NAME, JSON.stringify(ragieResponse)),
        role: "system",
      },
    ],
    model: openai("gpt-4o"),
    temperature: 0.3,
    schema: GenerateResponseSchema,
  });

  return completion.toTextStreamResponse({ headers: { "x-message-id": persisted.id } });
}
