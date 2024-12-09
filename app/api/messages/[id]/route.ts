import assert from "assert";

import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { requireSession } from "@/lib/auth-utils";
import db from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getTenantByUserId } from "@/lib/service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  const { id } = await params;
  const rs = await db
    .select()
    .from(schema.messages)
    .where(and(eq(schema.messages.tenantId, tenant.id), eq(schema.messages.id, id)));
  assert(rs.length === 1);
  return Response.json({ id, sources: rs[0].sources });
}
