import assert from "assert";

import { NextResponse } from "next/server";

import { updateSeats } from "@/lib/orb";
import { getExistingMetadata } from "@/lib/server/billing";
import { ORB_API_KEY } from "@/lib/server/settings";
import { requireAdminContextFromRequest } from "@/lib/server/utils";
// ORB_API_KEY import required for build

assert(ORB_API_KEY, "ORB_API_KEY is required");

export async function POST(req: Request) {
  const { tenant } = await requireAdminContextFromRequest(req);
  try {
    const body = await req.json();
    const { seats } = body;

    const existingMetadata = await getExistingMetadata(tenant.id);
    const orbSubscriptionId = existingMetadata.orbSubscriptionId;
    assert(orbSubscriptionId, "Must have orb subscription id");

    await updateSeats(orbSubscriptionId, seats);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating seats:", error);
    return NextResponse.json({ error: "Failed to update seats" }, { status: 500 });
  }
}
