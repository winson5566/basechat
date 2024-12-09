import { NextRequest } from "next/server";

import { getRagieClient } from "@/lib/ragie";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // FIXME: This is not currently scoped to a tenant
  const document = await getRagieClient().documents.get({ documentId: id });
  const summary = await getRagieClient().documents.getSummary({ documentId: id });
  return Response.json({ ...document, summary: summary.summary });
}
