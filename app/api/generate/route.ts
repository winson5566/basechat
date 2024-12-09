import { NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth-utils";
import { generate, getTenantByUserId } from "@/lib/service";

export const dynamic = "force-dynamic";

const MessagePayload = z.object({
  content: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);
  const payload = MessagePayload.parse(await request.json());

  return generate(tenant.id, payload);
}
