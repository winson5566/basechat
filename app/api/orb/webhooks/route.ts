import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import Orb from "orb-billing";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { ORB_WEBHOOK_SECRET } from "@/lib/server/settings";
import { ORB_API_KEY } from "@/lib/server/settings";

const orb = new Orb({
  apiKey: ORB_API_KEY,
});

interface OrbWebhookPayload {
  type: string;
  subscription: {
    id: string;
    start_date: string;
    plan: {
      id: string;
    };
    quantity: number;
    customer: {
      external_customer_id: string;
    };
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
  // Update tenant metadata with new subscription info
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        orbSubscriptionId: payload.subscription.id,
        plans: [
          {
            id: payload.subscription.id,
            startedAt: new Date(payload.subscription.start_date),
            endedAt: null,
            tier: payload.subscription.plan.id,
            seats: payload.subscription.quantity,
          },
        ],
      },
      paidStatus: "active",
    })
    .where(eq(schema.tenants.id, tenantId));
}

async function handlePlanChanged(tenantId: string, payload: OrbWebhookPayload) {
  // End current plan
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        plans: [
          {
            id: payload.subscription.id,
            startedAt: new Date(payload.subscription.start_date),
            endedAt: new Date(),
            tier: payload.subscription.plan.id,
            seats: payload.subscription.quantity,
          },
          {
            id: payload.subscription.id,
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
  // Update seats in current plan
  await db
    .update(schema.tenants)
    .set({
      metadata: {
        plans: [
          {
            id: payload.subscription.id,
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

async function handleUsageExceeded(tenantId: string, payload: OrbWebhookPayload) {
  // Handle usage exceeded event
  // This could trigger notifications or other actions
  console.log("Usage exceeded for tenant:", tenantId, payload);
}
