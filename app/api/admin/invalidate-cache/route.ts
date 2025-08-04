import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { invalidateAuthContextCacheForTenant } from "@/lib/server/service";
import { ADMIN_SECRET } from "@/lib/server/settings";

export async function POST(req: NextRequest) {
  try {
    // Authorization check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization header is required" }, { status: 401 });
    }

    // Check if the header starts with "Bearer " and extract the token
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header must start with 'Bearer '" }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    if (token !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Invalid admin secret" }, { status: 403 });
    }

    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return NextResponse.json({ error: "tenantId must be a valid UUID" }, { status: 400 });
    }

    // Verify tenant exists
    const [tenant] = await db
      .select({
        id: schema.tenants.id,
        name: schema.tenants.name,
        slug: schema.tenants.slug,
      })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId));

    if (!tenant) {
      return NextResponse.json({ error: `Tenant not found: ${tenantId}` }, { status: 404 });
    }

    // Get count of users for this tenant
    const userProfiles = await db
      .select({
        userId: schema.profiles.userId,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.tenantId, tenantId));

    // Invalidate cache for all users in this tenant
    await invalidateAuthContextCacheForTenant(tenantId);

    return NextResponse.json({
      success: true,
      method: "tenant-specific-tag",
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      affectedUsers: userProfiles.length,
    });
  } catch (error) {
    console.error("Failed to invalidate tenant cache:", error);
    return NextResponse.json({ error: "Failed to invalidate tenant cache" }, { status: 500 });
  }
}
