import assert from "assert";

import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { requireAuthContextFromRequest } from "@/lib/server/utils";

const createConversationRequest = z.object({
  title: z.string(),
});

export async function POST(request: NextRequest) {
  const { profile, tenant } = await requireAuthContextFromRequest(request);
  const json = await request.json();
  const { title } = createConversationRequest.parse(json);

  const rs = await db
    .insert(schema.conversations)
    .values({
      tenantId: tenant.id,
      profileId: profile.id,
      title,
    })
    .returning();

  assert(rs.length === 1);
  return Response.json({ id: rs[0].id });
}

export async function GET(request: NextRequest) {
  const { profile, tenant } = await requireAuthContextFromRequest(request);

  const rs = await db
    .select({
      id: schema.conversations.id,
      title: schema.conversations.title,
      createdAt: schema.conversations.createdAt,
      updatedAt: schema.conversations.updatedAt,
    })
    .from(schema.conversations)
    .where(and(eq(schema.conversations.tenantId, tenant.id), eq(schema.conversations.profileId, profile.id)))
    .orderBy(
      desc(
        sql`CASE WHEN ${schema.conversations.updatedAt} IS NOT NULL THEN ${schema.conversations.updatedAt} ELSE ${schema.conversations.createdAt} END`,
      ),
    );

  return Response.json(rs);
}
