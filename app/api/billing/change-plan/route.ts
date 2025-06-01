import { NextRequest, NextResponse } from "next/server";

import { Tier } from "@/lib/billing/pricing";
import { changePlan } from "@/lib/server/billing";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

export async function POST(req: NextRequest) {
  try {
    const { tenant } = await requireAdminContextFromRequest(req);
    const { tier, seats } = await req.json();

    if (!tier || !seats) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subscription = await changePlan(tenant.id, tier as Tier, seats);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error in change-plan route:", error);
    return NextResponse.json({ error: "Failed to change plan" }, { status: 500 });
  }
}
