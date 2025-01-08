import { NextRequest } from "next/server";

import { createConversationMessage, getConversationMessages } from "@/lib/data-access/conversation";
import { conversationMessagesResponseSchema, createConversationMessageRequestSchema } from "@/lib/schema";
import { requireSession } from "@/lib/server-utils";
import { getTenantByUserId } from "@/lib/service";

import { generate, retrieveConversationContext } from "./conversation-controller";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);
  const { conversationId } = await params;
  const messages = await getConversationMessages(tenant.id, conversationId);

  return Response.json(conversationMessagesResponseSchema.parse(messages));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);
  const { conversationId } = await params;
  const json = await request.json();
  const { content } = createConversationMessageRequestSchema.parse(json);

  const _message = await createConversationMessage({
    tenantId: tenant.id,
    conversationId,
    role: "user",
    content,
    sources: [],
  });
  const messages = await getConversationMessages(tenant.id, conversationId);
  const context = await retrieveConversationContext(tenant.id, tenant.name, messages);

  const [stream, messageId] = await generate(tenant.id, conversationId, tenant.name, context);
  return stream.toTextStreamResponse({ headers: { "x-message-id": messageId } });
}
