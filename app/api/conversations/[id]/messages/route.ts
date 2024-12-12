import { NextRequest } from "next/server";

import { requireSession } from "@/lib/auth-utils";
import { getConversationMessages, getTenantByUserId } from "@/lib/service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);
  const { id } = await params;
  const messages = await getConversationMessages(tenant.id, id);

  return Response.json(messages);
}
