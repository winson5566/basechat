import assert from "assert";

import { NextRequest } from "next/server";

import db from "@/lib/db";
import { connections } from "@/lib/db/schema";
import * as settings from "@/lib/settings";

export async function GET(request: NextRequest) {
  const connectionId = request.nextUrl.searchParams.get("connection_id")
  assert(connectionId, "expected connection_id")

  await saveConnection(connectionId);

  return Response.redirect(settings.BASE_URL)
}

async function saveConnection(connectionId: string) {
  await db.insert(connections).values({ connectionId, name: connectionId });
}
