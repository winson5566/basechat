import { NextRequest } from "next/server";

import { updateCurrentProfileSchema } from "@/lib/api";
import { setUserTenant } from "@/lib/server/service";
import { requireSession } from "@/lib/server/utils";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const json = await request.json();
  const payload = updateCurrentProfileSchema.parse(json);

  await setUserTenant(session.user.id, payload.tenantId);

  return new Response(null, { status: 200 });
}
