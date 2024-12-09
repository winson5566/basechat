import { requireSession } from "@/lib/auth-utils";
import { deleteConnection, getTenantByUserId } from "@/lib/service";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  await deleteConnection(tenant.id, id);

  return Response.json(200, {});
}
