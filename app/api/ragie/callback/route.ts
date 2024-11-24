import assert from "assert";

import { NextRequest } from "next/server";

import { saveConnection } from "@/lib/service";
import * as settings from "@/lib/settings";

export async function GET(request: NextRequest) {
  const connectionId = request.nextUrl.searchParams.get("connection_id");
  assert(connectionId, "expected connection_id");

  await saveConnection(connectionId, "syncing");

  return Response.redirect(settings.BASE_URL);
}
