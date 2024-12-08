import { requireSession } from "@/lib/auth-utils";
import { deleteConnection, getTenantIdByUserId } from "@/lib/service";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = await getTenantIdByUserId(session.user.id);

  await deleteConnection(tenantId, id);

  return Response.json(200, {});
}
