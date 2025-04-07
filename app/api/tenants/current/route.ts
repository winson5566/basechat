import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { updateTenantSchema, updateSearchSettingsSchema } from "@/lib/api";
import { modelArraySchema } from "@/lib/llm/types";
import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { createSearchSettings, updateSearchSettingsByTenantId } from "@/lib/server/service";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

export async function PATCH(request: NextRequest) {
  const { tenant } = await requireAdminContextFromRequest(request);

  const json = await request.json();
  const update = updateTenantSchema.partial().parse(json);

  // Additional validation for enabledModels if it's being updated
  if (update.enabledModels !== undefined) {
    const modelParseResult = modelArraySchema.safeParse(update.enabledModels);
    if (!modelParseResult.success) {
      return Response.json({ error: "Invalid model array" }, { status: 400 });
    }
  }

  await db.update(schema.tenants).set(update).where(eq(schema.tenants.id, tenant.id));

  return new Response();
}

export async function PUT(request: NextRequest) {
  const { tenant } = await requireAdminContextFromRequest(request);

  const json = await request.json();
  const update = updateSearchSettingsSchema.parse(json);

  try {
    // Try to update existing settings
    await updateSearchSettingsByTenantId(tenant.id, update);
  } catch (error) {
    await createSearchSettings(tenant.id, update);
  }

  return new Response();
}
