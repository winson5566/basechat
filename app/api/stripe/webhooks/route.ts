import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Stripe } from "stripe";

import { TenantMetadata } from "@/lib/billing/tenant";
import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "@/lib/server/settings";

const stripe = new Stripe(STRIPE_SECRET_KEY);
const webhookSecret = STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  let event: Stripe.Event;
  try {
    // Get the raw body
    const body = await req.text();
    const bodyBuffer = Buffer.from(body, "utf-8");

    // Get and clean the signature
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      throw new Error("No stripe signature found in request headers");
    }
    /**
     * TODO: still getting issue with constructEvent()
     * https://docs.stripe.com/webhooks/signature
     * https://github.com/stripe/stripe-node/blob/master/examples/webhook-signing/nextjs/app/api/webhooks/route.ts
     *
     */

    event = stripe.webhooks.constructEvent(bodyBuffer, signature, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case "customer.created":
        await handleStripeCustomerCreated(event);
        break;
      case "customer.updated":
        await handleStripeCustomerUpdated(event);
        break;
      case "customer.deleted":
        await handleStripeCustomerDeleted(event);
        break;
      case "payment_method.attached":
        await handlePaymentMethodAttached(event);
        break;
      case "payment_method.detached":
        await handlePaymentMethodDetached(event);
        break;
      default:
        console.log(`Unhandled Stripe webhook type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}

async function handleStripeCustomerCreated(event: Stripe.Event) {
  if (event.type !== "customer.created") return;

  const customer = event.data.object as Stripe.Customer;
  const tenantId = customer.metadata.tenantId;

  if (!tenantId) return;

  // Update tenant with Stripe customer ID
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        stripeCustomerId: customer.id,
      },
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handleStripeCustomerUpdated(event: Stripe.Event) {
  if (event.type !== "customer.updated") return;

  const customer = event.data.object as Stripe.Customer;
  const tenantId = customer.metadata?.tenantId;

  if (!tenantId) return;

  // Update tenant with latest Stripe customer info
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        stripeCustomerId: customer.id,
        // Preserve existing metadata
        ...(await getExistingMetadata(tenantId)),
      } as TenantMetadata,
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handleStripeCustomerDeleted(event: Stripe.Event) {
  if (event.type !== "customer.deleted") return;

  const customer = event.data.object as Stripe.Customer;
  const tenantId = customer.metadata?.tenantId;

  if (!tenantId) return;

  // Remove Stripe customer ID from tenant metadata
  const existingMetadata = await getExistingMetadata(tenantId);
  delete existingMetadata.stripeCustomerId;

  await db
    .update(schema.tenants)
    .set({
      metadata: existingMetadata as TenantMetadata,
      paidStatus: "expired",
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handlePaymentMethodAttached(event: Stripe.Event) {
  if (event.type !== "payment_method.attached") return;

  const paymentMethod = event.data.object as Stripe.PaymentMethod;
  const customer = (await stripe.customers.retrieve(paymentMethod.customer as string)) as Stripe.Customer;
  const tenantId = customer.metadata?.tenantId;

  if (!tenantId) return;

  // Update tenant with payment method info
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        ...(await getExistingMetadata(tenantId)),
        paymentMethodId: paymentMethod.id,
        paymentMethodType: paymentMethod.type,
      } as TenantMetadata,
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handlePaymentMethodDetached(event: Stripe.Event) {
  if (event.type !== "payment_method.detached") return;

  const paymentMethod = event.data.object as Stripe.PaymentMethod;
  const customer = (await stripe.customers.retrieve(paymentMethod.customer as string)) as Stripe.Customer;
  const tenantId = customer.metadata?.tenantId;

  if (!tenantId) return;

  // Remove payment method info from tenant metadata
  const existingMetadata = await getExistingMetadata(tenantId);
  delete existingMetadata.paymentMethodId;
  delete existingMetadata.paymentMethodType;

  await db
    .update(schema.tenants)
    .set({
      metadata: existingMetadata as TenantMetadata,
    })
    .where(eq(schema.tenants.id, tenantId));
}

// Helper function to get existing metadata
async function getExistingMetadata(tenantId: string): Promise<TenantMetadata> {
  const tenant = await db
    .select({ metadata: schema.tenants.metadata })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId))
    .limit(1);

  return (tenant[0]?.metadata || {}) as TenantMetadata;
}
