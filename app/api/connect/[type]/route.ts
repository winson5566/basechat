import { NextRequest } from "next/server";
import { Ragie } from "ragie";

export const dynamic = "force-dynamic"; // no caching

interface Params {
  type: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const client = new Ragie({ auth: process.env.RAGIE_API_KEY });
  const { type } = await params;

  const payload = await client.connections.createOAuthRedirectUrl({
    redirectUri: process.env.BASE_URL!,
    sourceType: type,
  });

  return Response.json(payload);
}
