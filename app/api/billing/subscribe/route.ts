import { NextRequest, NextResponse } from "next/server";

import {
  createOrbCustomer,
  createStripeCustomer,
  handleInitialSubscription,
  updateTenantBillingInfo,
} from "@/lib/server/billing";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

export async function POST(req: NextRequest) {
  try {
    const { tenant } = await requireAdminContextFromRequest(req);
    const { tier, seats, email, name } = await req.json();

    // Check if tenant already has billing info
    if (tenant.metadata?.stripeCustomerId || tenant.metadata?.orbCustomerId) {
      return NextResponse.json({ error: "Tenant already has billing information" }, { status: 400 });
    }

    // Create Stripe customer
    const stripeCustomer = await createStripeCustomer(tenant.id, email, name);

    // Create Orb customer
    const orbCustomer = await createOrbCustomer(stripeCustomer.id, tenant.id, email, name);

    // Update tenant with customer IDs
    await updateTenantBillingInfo(tenant.id, stripeCustomer.id, orbCustomer.id);

    // Create initial subscription
    const subscription = await handleInitialSubscription(tenant.id, orbCustomer.id, tier, seats);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
