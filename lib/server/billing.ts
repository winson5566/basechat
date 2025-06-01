import { eq } from "drizzle-orm";
import Orb from "orb-billing";
import Stripe from "stripe";

import db from "./db";
import * as schema from "./db/schema";
import { STRIPE_SECRET_KEY, ORB_API_KEY } from "./settings";

const stripe = new Stripe(STRIPE_SECRET_KEY);

const orb = new Orb({
  apiKey: ORB_API_KEY,
});

export async function createStripeCustomer(tenantId: string, email: string, name: string) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      tenantId,
    },
  });

  return customer;
}

export async function createOrbCustomer(stripeCustomerId: string, tenantId: string, email: string, name: string) {
  const customer = await orb.customers.create({
    external_customer_id: tenantId,
    email,
    name,
    payment_provider: "stripe_charge",
    payment_provider_id: stripeCustomerId,
  });

  return customer;
}

export async function updateTenantBillingInfo(tenantId: string, stripeCustomerId: string, orbCustomerId: string) {
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        stripeCustomerId,
        orbCustomerId,
      },
    })
    .where(eq(schema.tenants.id, tenantId));
}

export async function handleInitialSubscription(tenantId: string, orbCustomerId: string, tier: string, seats: number) {
  // Create subscription in Orb
  const subscription = await orb.subscriptions.create({
    customer_id: orbCustomerId,
    plan_id: tier, // This should match your Orb plan IDs
    quantity: seats,
  });

  // Update tenant metadata with subscription info
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        orbSubscriptionId: subscription.id,
        plans: [
          {
            id: subscription.id,
            startedAt: new Date(),
            endedAt: null,
            tier,
            seats,
          },
        ],
      },
      paidStatus: "active",
    })
    .where(eq(schema.tenants.id, tenantId));

  return subscription;
}
