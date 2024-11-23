import { NextRequest } from "next/server";
import { Ragie } from "ragie";

import * as settings from "@/lib/settings";

export const dynamic = "force-dynamic"; // no caching

interface Params {
  type: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const client = new Ragie({ auth: settings.RAGIE_API_KEY });
  const { type } = await params;

  const payload = await client.connections.createOAuthRedirectUrl({
    redirectUri: [settings.BASE_URL, "api/ragie/callback"].join("/"),
    sourceType: type,
  });

  return Response.json(payload);
}
