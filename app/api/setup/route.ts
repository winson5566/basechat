import { NextRequest } from "next/server";
import { z } from "zod";

import { setupRequestSchema } from "@/lib/api";
import { createTenant, setCurrentProfileId } from "@/lib/server/service";
import { requireSession } from "@/lib/server/utils";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const payload = setupRequestSchema.parse(await request.json());
  const { name, logoFileName, logoObjectName, logoUrl } = payload;

  const { profile, tenant } = await createTenant(session.user.id, name, {
    logoFileName,
    logoObjectName,
    logoUrl,
  });

  await setCurrentProfileId(session.user.id, profile.id);

  return Response.json({ profile, tenant });
}
