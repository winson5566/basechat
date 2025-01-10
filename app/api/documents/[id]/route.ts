import { NextRequest } from "next/server";

import { getRagieClient } from "@/lib/ragie";
import { requireSession } from "@/lib/server-utils";
import { getTenantByUserId } from "@/lib/service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  const { id } = await params;

  const document = await getRagieClient().documents.get({ partition: tenant.id, documentId: id });
  const summary = await getRagieClient().documents.getSummary({ partition: tenant.id, documentId: id });

  return Response.json({ ...document, summary: summary.summary });
}
