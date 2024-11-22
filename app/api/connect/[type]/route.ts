import { NextRequest } from "next/server";
import { Ragie } from "ragie";

export const dynamic = "force-dynamic"; // no caching

interface Params {
  type: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const client = new Ragie({ auth: process.env.RAGIE_API_KEY });

  const payload =
    await client.connections.createOauthRedirectUrlConnectionsOauthPost({
      redirectUri: process.env.BASE_URL!,
      sourceType: params.type,
    });

  return Response.json(payload);
}
