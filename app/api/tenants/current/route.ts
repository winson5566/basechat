import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { updateTenantSchema, updateSearchSettingsSchema } from "@/lib/api";
import { modelArraySchema } from "@/lib/llm/types";
import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { getSearchSettingsById, updateSearchSettingsById } from "@/lib/server/service";
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

  if (!tenant.searchSettingsId) {
    // Create new search settings if it doesn't exist
    const [newSettings] = await db
      .insert(schema.searchSettings)
      .values({
        ...update,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: schema.searchSettings.id });

    // Update tenant with new search settings id
    await db.update(schema.tenants).set({ searchSettingsId: newSettings.id }).where(eq(schema.tenants.id, tenant.id));
  } else {
    // Update existing search settings
    await updateSearchSettingsById(tenant.searchSettingsId, update);
  }

  return new Response();
}

export async function GET(request: NextRequest) {
  const { tenant } = await requireAdminContextFromRequest(request);

  if (!tenant.searchSettingsId) {
    return Response.json({ error: "Search settings not found" }, { status: 404 });
  }
  const searchSettings = await getSearchSettingsById(tenant.searchSettingsId);
  return Response.json(searchSettings);
}
