import { eq } from "drizzle-orm";
import Orb from "orb-billing";
import Stripe from "stripe";

import { TenantMetadata } from "@/lib/billing/tenant";
import { getPlanById, getPlanSeatId } from "@/lib/orb";

import db from "./db";
import * as schema from "./db/schema";
import { getMembersByTenantId } from "./service";
import { STRIPE_SECRET_KEY, ORB_API_KEY, ORB_DEVELOPER_PLAN_ID } from "./settings";

export async function getExistingMetadata(tenantId: string): Promise<TenantMetadata> {
  const tenant = await db
    .select({ metadata: schema.tenants.metadata })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1);

  return (tenant[0]?.metadata || {}) as TenantMetadata;
}

export async function createStripeCustomer(tenantId: string, orbCustomerId: string, email: string, name: string) {
  const stripe = new Stripe(STRIPE_SECRET_KEY, { typescript: true });
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        orb_customer_id: orbCustomerId,
        orb_external_customer_id: tenantId,
        payment_source: "orb",
      },
    });
    return customer;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

export async function createOrbCustomer(tenantId: string, email: string, name: string) {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  try {
    const customer = await orb.customers.create({
      external_customer_id: tenantId,
      email,
      name,
    });
    return customer;
  } catch (error) {
    console.error("Error creating Orb customer:", error);
    throw error;
  }
}

export async function provisionBillingCustomer(tenantId: string, userFullName: string, email: string) {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  try {
    // Get tenant metadata
    const existingMetadata = await getExistingMetadata(tenantId);

    // Create Orb customer if doesn't exist
    let orbCustomerId = existingMetadata.orbCustomerId;
    if (!orbCustomerId) {
      const orbCustomer = await createOrbCustomer(tenantId, email, userFullName);
      orbCustomerId = orbCustomer.id;
    }
    // Create Stripe customer if doesn't exist
    let stripeCustomerId = existingMetadata.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await createStripeCustomer(tenantId, orbCustomerId, email, userFullName);
      stripeCustomerId = stripeCustomer.id;
    }

    // Add stripe customer id to orb customer
    await orb.customers.update(orbCustomerId, {
      payment_provider: "stripe_charge",
      payment_provider_id: stripeCustomerId,
    });

    // Subscribe to Developer plan if no subscription exists
    let orbSubscriptionId = existingMetadata.orbSubscriptionId;
    if (!orbSubscriptionId) {
      const seatPriceId = await getPlanSeatId(await getPlanById(ORB_DEVELOPER_PLAN_ID));
      const { totalUsers, totalInvites } = await getMembersByTenantId(tenantId, 1, 10);
      const usedSeatCount = totalUsers + totalInvites;
      const orbSubscription = await orb.subscriptions.create({
        customer_id: orbCustomerId,
        plan_id: ORB_DEVELOPER_PLAN_ID,
        replace_prices: [
          {
            replaces_price_id: seatPriceId,
            fixed_price_quantity: usedSeatCount,
          },
        ],
      });
      orbSubscriptionId = orbSubscription.id;
    }

    return {
      newStripeCustomerId: stripeCustomerId,
      newOrbCustomerId: orbCustomerId,
      newOrbSubscriptionId: orbSubscriptionId,
    };
  } catch (error) {
    console.error("Error starting subscription:", error);
    throw error;
  }
}
