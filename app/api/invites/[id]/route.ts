import { NextRequest } from "next/server";

import { requireAuthContext } from "@/lib/server-utils";
import { deleteInviteById } from "@/lib/service";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { tenant } = await requireAuthContext();
  const { id } = await params;
  await deleteInviteById(tenant.id, id);
  return new Response(null, { status: 200 });
}
