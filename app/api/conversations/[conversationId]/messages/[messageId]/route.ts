import { NextRequest } from "next/server";

import { getConversationMessage } from "@/lib/data-access/conversation";
import { requireSession } from "@/lib/server-utils";
import { getTenantByUserId } from "@/lib/service";

type Params = { conversationId: string; messageId: string };

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  const { conversationId, messageId } = await params;
  const message = await getConversationMessage(tenant.id, conversationId, messageId);

  return Response.json(message);
}
