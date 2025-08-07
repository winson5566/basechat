import { NextRequest, NextResponse } from "next/server";

import { getCurrentPlan } from "@/lib/billing/tenant";
import { changePlan, isCurrentlyOnFreeTier, isCurrentlyOnSubscription } from "@/lib/orb";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

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
      id: tenant.id,
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

    let onFreeTier = false;
    const currentPlan = getCurrentPlan(metadata);
    if (currentPlan) {
      onFreeTier = await isCurrentlyOnFreeTier(currentPlan);
    } else {
      onFreeTier = true;
    }

    const updatedSubscription = await changePlan(planType, false, onFreeTier, tenantWithMetadata);

    return NextResponse.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    console.error("Error changing plan:", error);
    return NextResponse.json({ error: "Failed to change plan" }, { status: 500 });
  }
}
