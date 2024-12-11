import { NextRequest } from "next/server";

import { requireSession } from "@/lib/auth-utils";
import { GenerateRequestSchema } from "@/lib/schema";
import { generate, getTenantByUserId } from "@/lib/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);
  const payload = GenerateRequestSchema.parse(await request.json());

  return generate(tenant.id, payload);
}
