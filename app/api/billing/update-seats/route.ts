import assert from "assert";

import { NextResponse } from "next/server";

import { getCurrentPlan } from "@/lib/billing/tenant";
import { updateSeats } from "@/lib/orb";
import { getExistingMetadata } from "@/lib/server/billing";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

export async function POST(req: Request) {
  const { tenant } = await requireAdminContextFromRequest(req);
  try {
    const body = await req.json();
    const { seats } = body;

    const existingMetadata = await getExistingMetadata(tenant.id);
    const orbSubscriptionId = existingMetadata.orbSubscriptionId;
    assert(orbSubscriptionId, "Must have orb subscription id");

    const currentPlan = getCurrentPlan(existingMetadata);
    if (!currentPlan) {
      return NextResponse.json({ error: "No plan found" }, { status: 400 });
    }
    if (currentPlan.name === "enterprise") {
      return NextResponse.json({ error: "Contact sales to upgrade Enterprise plans" }, { status: 400 });
    }

    await updateSeats(orbSubscriptionId, seats);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating seats:", error);
    return NextResponse.json({ error: "Failed to update seats" }, { status: 500 });
  }
}
