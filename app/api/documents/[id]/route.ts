import { NextRequest } from "next/server";

import { getRagieClientAndPartition } from "@/lib/server/ragie";
import { requireAuthContextFromRequest, requireAdminContextFromRequest } from "@/lib/server/utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { tenant } = await requireAuthContextFromRequest(request);
  const { id } = await params;
  const { client, partition } = await getRagieClientAndPartition(tenant.id);

  const document = await client.documents.get({ partition, documentId: id });
  const summary = await client.documents.getSummary({ partition, documentId: id });

  return Response.json({ ...document, summary: summary.summary });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { tenant } = await requireAdminContextFromRequest(request);
  const { id } = await params;
  const { client, partition } = await getRagieClientAndPartition(tenant.id);
  const result = await client.documents.delete({ partition, documentId: id });
  return Response.json(result);
}
