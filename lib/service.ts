import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { eq } from "drizzle-orm";

import db from "./db";
import * as schema from "./db/schema";
import { getRagieClient, getRagieConnection } from "./ragie";
import { GenerateRequest, GenerateResponseSchema } from "./schema";
import * as settings from "./settings";

export async function saveConnection(id: string, status: string) {
  const qs = await db.select().from(schema.connections).where(eq(schema.connections.connectionId, id)).for("update");
  const connection = qs.length === 1 ? qs[0] : null;

  if (!connection) {
    const ragieConnection = await getRagieConnection(id);
    await db.insert(schema.connections).values({
      connectionId: id,
      name: ragieConnection.source_display_name,
      status,
    });
  } else {
    await db.update(schema.connections).set({ status }).where(eq(schema.connections.connectionId, id));
  }
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

export async function generate({ content }: GenerateRequest): Promise<Response> {
  const ragieResponse = await getRagieClient().retrievals.retrieve({
    query: content,
    topK: 6,
    rerank: true,
  });

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

  return completion.toTextStreamResponse();
}
