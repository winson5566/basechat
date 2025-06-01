import assert from "assert";

import { eq } from "drizzle-orm";
import Orb from "orb-billing";
import Stripe from "stripe";


import { PRICING_TIER_CONFIG, Tier } from "@/lib/billing/pricing";
import { getCurrentPlan, TenantMetadata } from "@/lib/billing/tenant";

import db from "./db";
import * as schema from "./db/schema";
import { STRIPE_SECRET_KEY, ORB_API_KEY } from "./settings";

const stripe = new Stripe(STRIPE_SECRET_KEY);

const orb = new Orb({
  apiKey: ORB_API_KEY,
});

// Helper function to get existing metadata
async function getExistingMetadata(tenantId: string): Promise<TenantMetadata> {
  const tenant = await db
    .select({ metadata: schema.tenants.metadata })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1);

  return (tenant[0]?.metadata || {}) as TenantMetadata;
}

export async function createStripeCustomer(tenantId: string, email: string, name: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { tenantId },
    });
    return customer;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

export async function createOrbCustomer(stripeCustomerId: string, tenantId: string, email: string, name: string) {
  try {
    const customer = await orb.customers.create({
      external_customer_id: tenantId,
      email,
      name,
      payment_provider: "stripe_charge",
      payment_provider_id: stripeCustomerId,
    });
    return customer;
  } catch (error) {
    console.error("Error creating Orb customer:", error);
    throw error;
  }
}

export async function startSubscription(tenantId: string, email: string, tier: Tier, seats: number) {
  try {
    // Get tenant info
    const rs = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    assert(rs.length === 1, "expected 1 tenant");

    const tenant = rs[0];
    const existingMetadata = await getExistingMetadata(tenantId);

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = existingMetadata.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await createStripeCustomer(tenantId, email, tenant.name);
      stripeCustomerId = stripeCustomer.id;
    }

    // Create Orb customer if doesn't exist
    let orbCustomerId = existingMetadata.orbCustomerId;
    if (!orbCustomerId) {
      const orbCustomer = await createOrbCustomer(stripeCustomerId, tenantId, email, tenant.name);
      orbCustomerId = orbCustomer.id;
    }

    // Create subscription in Orb
    const subscription = await orb.subscriptions.create({
      customer_id: orbCustomerId,
      plan_id: tier,
      fixed_fee_quantity: seats,
    });

    return subscription;
  } catch (error) {
    console.error("Error starting subscription:", error);
    throw error;
  }
}

export async function changePlan(tenantId: string, newTier: Tier, seats: number) {
  try {
    const rs = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    assert(rs.length === 1, "expected 1 tenant");

    const tenant = rs[0];
    const existingMetadata = await getExistingMetadata(tenantId);
    const currentPlan = getCurrentPlan(existingMetadata);
    if (!currentPlan) throw new Error("No active plan found");

    // TODO: implement this immediate plan change instead of using 'update'
    // updatedSub = await orb.subscriptions.schedulePlanChange(
    //     session.billing.subscriptionId,
    //     {
    //       plan_id: nextPlanId,
    //       change_option: "immediate",
    //       add_adjustments: adjustments,
    //       replace_prices: [
    //         {
    //           replaces_price_id: embeddedConnectorPriceId,
    //           fixed_price_quantity: embeddedConnecterCnt,
    //         },
    //       ],
    //     },
    //   );

    // Update subscription in Orb
    const subscription = await orb.subscriptions.update(currentPlan.id, {
      plan_id: newTier,
      fixed_fee_quantity: seats,
    });

    return subscription;
  } catch (error) {
    console.error("Error changing plan:", error);
    throw error;
  }
}

export async function checkPartitionLimit(tenantId: string) {
  try {
    // Get tenant info
    const rs = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    assert(rs.length === 1, "expected 1 tenant");

    const tenant = rs[0];
    const existingMetadata = await getExistingMetadata(tenantId);
    const currentPlan = getCurrentPlan(existingMetadata);
    if (!currentPlan) return false;

    const tierConfig = PRICING_TIER_CONFIG.find((t) => t.id === currentPlan.tier);
    if (!tierConfig) return false;

    // TODO: Implement actual partition count check
    const currentPartitionCount = 0; // Placeholder

    return {
      isExceeded: currentPartitionCount > tierConfig.partitionLimit,
      currentCount: currentPartitionCount,
      limit: tierConfig.partitionLimit,
    };
  } catch (error) {
    console.error("Error checking partition limit:", error);
    throw error;
  }
}
