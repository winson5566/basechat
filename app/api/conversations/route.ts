import assert from "assert";

import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { requireSession } from "@/lib/auth-utils";
import db from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getTenantByUserId } from "@/lib/service";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);
  const rs = await db.insert(schema.conversations).values({ tenantId: tenant.id, title: "Placeholder" }).returning();
  assert(rs.length === 1);
  return Response.json({ id: rs[0].id });
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  const rs = await db
    .select({
      id: schema.conversations.id,
      title: schema.conversations.title,
      createdAt: schema.conversations.createdAt,
      updatedAt: schema.conversations.updatedAt,
    })
    .from(schema.conversations)
    .where(eq(schema.conversations.tenantId, tenant.id));

  return Response.json(rs);
}
