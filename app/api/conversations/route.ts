import assert from "assert";

import { NextRequest } from "next/server";

import { requireSession } from "@/lib/auth-utils";
import db from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getTenantByUserId } from "@/lib/service";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);
  const rs = await db.insert(schema.conversations).values({ tenantId: tenant.id }).returning();
  assert(rs.length === 1);
  return Response.json({ id: rs[0].id });
}
