import { NextResponse } from "next/server";

import { getUserCountByTenantId } from "@/lib/server/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantIds = searchParams.get("tenantIds")?.split(",") || [];

  const counts: Record<string, number> = {};
  for (const id of tenantIds) {
    counts[id] = await getUserCountByTenantId(id);
  }

  return NextResponse.json(counts);
}
