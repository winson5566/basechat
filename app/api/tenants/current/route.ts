import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { updateTenantSchema } from "@/lib/api";
import { modelArraySchema } from "@/lib/llm/types";
import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { invalidateAuthContextCacheForTenant } from "@/lib/server/service";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

export async function PATCH(request: NextRequest) {
  const { tenant } = await requireAdminContextFromRequest(request);

  const json = await request.json();
  const update = updateTenantSchema.partial().parse(json);

  // Additional validation for disabledModels if it's being updated
  if (update.disabledModels !== undefined) {
    const modelParseResult = modelArraySchema.safeParse(update.disabledModels);
    if (!modelParseResult.success) {
      return Response.json({ error: "Invalid model array" }, { status: 400 });
    }
  }

  try {
    await db.update(schema.tenants).set(update).where(eq(schema.tenants.id, tenant.id));
  } catch (error) {
    console.error("Failed to update tenant:", error);
    return Response.json({ error: "Failed to update tenant settings" }, { status: 500 });
  }

  try {
    await invalidateAuthContextCacheForTenant(tenant.id);
  } catch (error) {
    console.error("Failed to invalidate auth context cache for tenant:", error);
  }

  return new Response();
}
