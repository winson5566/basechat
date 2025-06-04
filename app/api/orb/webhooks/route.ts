import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Orb from "orb-billing";

import { TenantPlan, TenantMetadata } from "@/lib/billing/tenant";
import { getPlanIdFromType, getPlanTypeFromId } from "@/lib/orb";
import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { getTenantByTenantId } from "@/lib/server/service";
import { ORB_WEBHOOK_SECRET, ORB_API_KEY } from "@/lib/server/settings";

const orb = new Orb({
  apiKey: ORB_API_KEY,
});

interface OrbWebhookPayload {
  type: string;
  customer: {
    id: string;
    external_customer_id: string;
    payment_provider_id: string;
  };
  subscription: {
    id: string;
    start_date: string;
    customer: {
      id: string;
      external_customer_id: string;
    };
    plan: {
      id: string;
    };
    quantity: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersObj: Record<string, string> = {};

    // Convert headers to plain object
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    // Verify webhook signature using Orb SDK
    const payload = orb.webhooks.unwrap(body, headersObj, ORB_WEBHOOK_SECRET) as OrbWebhookPayload;
    const webhookType = payload.type;
    console.log(`Received orb webhook: ${webhookType}`);

    try {
      switch (webhookType) {
        case "customer.created": {
          const tenantId = payload.customer.external_customer_id;
          await handleCustomerCreated(tenantId, payload);
          break;
        }
        case "customer.edited": {
          const tenantId = payload.customer.external_customer_id;
          await handleCustomerEdited(tenantId, payload);
          break;
        }
        case "subscription.started": {
          const tenantId = payload.subscription.customer.external_customer_id;
          await handleSubscriptionStarted(tenantId, payload);
          break;
        }
        case "subscription.plan_changed": {
          const tenantId = payload.subscription.customer.external_customer_id;
          await handlePlanChanged(tenantId, payload);
          break;
        }
        case "subscription.fixed_fee_quantity_updated": {
          const tenantId = payload.subscription.customer.external_customer_id;
          await handleFixedFeeQuantityUpdated(tenantId, payload);
          break;
        }
        case "subscription.usage_exceeded": {
          const tenantId = payload.subscription.customer.external_customer_id;
          await handleUsageExceeded(tenantId, payload);
          break;
        }
        default: {
          console.log("Unhandled orb webhook type:", webhookType);
          break;
        }
      }
    } catch (error) {
      console.error("Error processing orb webhook:", error);
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing orb webhook:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}

async function handleSubscriptionStarted(tenantId: string, payload: OrbWebhookPayload) {
  const tenant = await getTenantByTenantId(tenantId);
  const existingMetadata = (tenant.metadata || {}) as TenantMetadata;
  const existingPlans = existingMetadata.plans || [];
  const existingPaidStatus = tenant.paidStatus;

  // Update tenant metadata with new subscription info
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        stripeCustomerId: existingMetadata.stripeCustomerId,
        orbSubscriptionId: payload.subscription.id,
        orbCustomerId: payload.subscription.customer.id,
        plans: [
          ...existingPlans.map((plan: TenantPlan) => ({
            ...plan,
            endedAt: plan.endedAt ? plan.endedAt : new Date(), // End all previous plans
          })),
          {
            id: payload.subscription.id,
            name: getPlanTypeFromId(payload.subscription.plan.id) || "developer",
            startedAt: new Date(payload.subscription.start_date),
            endedAt: null,
            tier: payload.subscription.plan.id,
            seats: payload.subscription.quantity,
          },
        ],
      },
      paidStatus: payload.subscription.plan.id === getPlanIdFromType("developer") ? existingPaidStatus : "active",
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handlePlanChanged(tenantId: string, payload: OrbWebhookPayload) {
  // Get existing tenant metadata
  const tenant = await getTenantByTenantId(tenantId);
  const existingMetadata = (tenant.metadata || {}) as TenantMetadata;
  const existingPlans = existingMetadata.plans || [];

  await db
    .update(schema.tenants)
    .set({
      metadata: {
        stripeCustomerId: existingMetadata.stripeCustomerId,
        orbSubscriptionId: existingMetadata.orbSubscriptionId,
        orbCustomerId: existingMetadata.orbCustomerId,
        plans: [
          ...existingPlans.map((plan: TenantPlan) => ({
            ...plan,
            endedAt: plan.endedAt ? plan.endedAt : new Date(), // End all previous plans
          })),
          {
            id: payload.subscription.id,
            name: getPlanTypeFromId(payload.subscription.plan.id) || "developer",
            startedAt: new Date(payload.subscription.start_date),
            endedAt: null,
            tier: payload.subscription.plan.id,
            seats: payload.subscription.quantity,
          },
        ],
      },
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handleFixedFeeQuantityUpdated(tenantId: string, payload: OrbWebhookPayload) {
  // Get existing tenant metadata
  const tenant = await getTenantByTenantId(tenantId);

  const existingMetadata = (tenant.metadata || {}) as TenantMetadata;
  const existingPlans = existingMetadata.plans || [];

  // Update seats in current plan
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        ...existingMetadata,
        plans: existingPlans.map((plan: TenantPlan) => {
          if (plan.id === payload.subscription.id) {
            return {
              ...plan,
              seats: payload.subscription.quantity,
            };
          }
          return plan;
        }),
      },
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handleUsageExceeded(tenantId: string, payload: OrbWebhookPayload) {
  // Handle usage exceeded event
  // This could trigger notifications or other actions
  console.log("Usage exceeded for tenant:", tenantId, payload);
}

async function handleCustomerCreated(tenantId: string, payload: OrbWebhookPayload) {
  const tenant = await getTenantByTenantId(tenantId);
  const existingMetadata = (tenant.metadata || {}) as TenantMetadata;
  // Update tenant metadata with Orb customer ID
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        ...existingMetadata,
        orbCustomerId: payload.customer.id,
      },
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handleCustomerEdited(tenantId: string, payload: OrbWebhookPayload) {
  const tenant = await getTenantByTenantId(tenantId);
  const existingMetadata = (tenant.metadata || {}) as TenantMetadata;
  // Update tenant metadata with Stripe customer ID
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        ...existingMetadata,
        stripeCustomerId: payload.customer.payment_provider_id,
      },
    })
    .where(eq(schema.tenants.id, tenantId));
}
