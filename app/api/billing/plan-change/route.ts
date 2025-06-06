import { NextRequest, NextResponse } from "next/server";

import { changePlan, isCurrentlyOnSubscription } from "@/lib/orb";
import { ORB_API_KEY } from "@/lib/server/settings";
import { requireAdminContextFromRequest } from "@/lib/server/utils";
// required for build

export async function POST(req: NextRequest) {
  const { tenant } = await requireAdminContextFromRequest(req);
  try {
    const { planType } = await req.json();

    const metadata = tenant.metadata;

    if (!metadata) {
      return NextResponse.json({ error: "Tenant metadata not found" }, { status: 400 });
    }

    const { stripeCustomerId, orbCustomerId, orbSubscriptionId } = metadata;
    if (!stripeCustomerId || !orbCustomerId || !orbSubscriptionId) {
      return NextResponse.json({ error: "Missing required billing metadata" }, { status: 400 });
    }

    const tenantWithMetadata = {
      metadata: {
        stripeCustomerId,
        orbCustomerId,
        orbSubscriptionId,
      },
    };

    const onSubscription = await isCurrentlyOnSubscription(planType, orbCustomerId);
    if (onSubscription) {
      return NextResponse.json({ error: "You are already on that plan" }, { status: 400 });
    }
    const updatedSubscription = await changePlan(planType, false, tenantWithMetadata);

    return NextResponse.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error("Error changing plan:", error);
    return NextResponse.json({ error: "Failed to change plan" }, { status: 500 });
  }
}
