import assert from "assert";

import assertNever from "assert-never";
import { addDays } from "date-fns";
import Orb from "orb-billing";
import { Plan, Subscription, SubscriptionSchedulePlanChangeParams } from "orb-billing/resources/index.mjs";

import { PlanType, SEAT_ADD_ON_NAME } from "./orb-types";
import { ORB_API_KEY, ORB_DEVELOPER_PLAN_ID, ORB_PRO_PLAN_ID, ORB_STARTER_PLAN_ID } from "./server/settings";
import { startOfDayUtc, nowUtc } from "./utils";

export async function getSubscriptions(orbCustomerId: string) {
  const orb = new Orb();
  const response = await orb.subscriptions.list({
    customer_id: [orbCustomerId],
  });
  return response.data;
}

export async function changePlan(
  nextPlanType: PlanType,
  preview: boolean = false,
  tenant: {
    metadata: {
      stripeCustomerId: string;
      orbCustomerId: string;
      orbSubscriptionId?: string;
    };
  },
): Promise<Orb.Subscription> {
  const orb = new Orb();
  if (!tenant.metadata.orbSubscriptionId) {
    throw new Error("Orb subscription ID not found");
  }

  const sub = await orb.subscriptions.fetch(tenant.metadata.orbSubscriptionId);
  const seatCount = await getUpcomingSubscriptionSeatCount(sub);
  const currPlan = sub.plan;
  if (!currPlan) {
    throw new Error("Current plan not found");
  }
  const currSeatPrice = getPlanPrice(currPlan, SEAT_ADD_ON_NAME);

  const nextPlanId = getPlanIdFromType(nextPlanType as PlanType);
  const nextPlan = await orb.plans.fetch(nextPlanId);
  const seatPriceId = getPlanSeatId(nextPlan, sub.customer);
  const nextSeatPrice = await orb.prices.fetch(seatPriceId);
  nextSeatPrice.fixed_price_quantity = seatCount;

  // Upgrades occur immediately, downgrades occur at the end of the billing period
  // For upgrades, the next invoice needs to be discounted by paid portion of the current
  // months software fee, this discounting occurs using a CreditNote which is displayed to
  // the user in the UI. This CreditNote will be applied to the invoice for the plan being
  // upgraded to. The cost of embedded connectors will be discounted based on the cost of
  // the embedded connector price on the new plan multiplied by the current quantity.

  // Find the invoice in the current billing period with the software fee on it
  const adjustments: Array<SubscriptionSchedulePlanChangeParams.AddAdjustment> = [];
  // Only discount if embedded connector price > 0
  if (seatCount > 0 && (currSeatPrice as any).unit_config.unit_amount > 0) {
    adjustments.push({
      adjustment: {
        applies_to_price_ids: [seatPriceId],
        adjustment_type: "amount_discount",
        amount_discount: String(seatCount * (nextSeatPrice as any).unit_config.unit_amount),
      },
      end_date: addDays(startOfDayUtc(), 1).toISOString(),
    });
  }

  try {
    // HACK: The Orb API can preview changes by providing headers these "Include-Changed-Resources": "true", "Dry-Run": "true"
    //       Unfortunately those headers are incompatible with setting an idempotency key,
    //       and it is not possible to unset the idempotency key in the Orb API client.
    let updatedSub: Orb.Subscription;
    if (preview) {
      try {
        const updatedSubRes = await fetch(
          `https://api.withorb.com/v1/subscriptions/${tenant.metadata.orbSubscriptionId}/schedule_plan_change`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ORB_API_KEY}`,
              "Include-Changed-Resources": "true",
              "Dry-Run": "true",
            },
            body: JSON.stringify({
              plan_id: nextPlanId,
              change_option: "immediate",
              add_adjustments: adjustments,
              replace_prices: [
                {
                  replaces_price_id: seatPriceId,
                  fixed_price_quantity: seatCount,
                },
              ],
            }),
          },
        );
        updatedSub = await updatedSubRes.json();
      } catch (err: unknown) {
        console.error(err);
        throw err;
      }
    } else {
      updatedSub = await orb.subscriptions.schedulePlanChange(tenant.metadata.orbSubscriptionId, {
        plan_id: nextPlanId,
        change_option: "immediate",
        add_adjustments: adjustments,
        replace_prices: [
          {
            replaces_price_id: seatPriceId,
            fixed_price_quantity: seatCount,
          },
        ],
      });
    }
    console.log("Successfully scheduled plan change", {
      subscriptionId: updatedSub.id,
      nextPlanId,
    });

    // Issue invoices immediately for PLG users
    if (!preview) {
      const invoices = await orb.invoices.list({
        subscription_id: updatedSub.id,
        status: ["draft"],
      });
      const now = nowUtc();
      const dueInvoices = invoices.data.filter(
        (i) => i.due_date && i.due_date <= now.toISOString() && parseFloat(i.total) > 0,
      );
      for (const invoice of dueInvoices) {
        console.log("Issuing invoice", {
          invoiceId: invoice.id,
          subscriptionId: updatedSub.id,
        });
        await orb.invoices.issue(invoice.id);
      }
    }

    return updatedSub;
  } catch (err: unknown) {
    console.error(err);
    throw err;
  }
}

export async function getUpcomingSubscriptionSeatCount(subscription: Subscription) {
  if (!subscription || !subscription.plan) {
    throw new Error("Subscription not found");
  }
  const priceId = getPlanSeatId(subscription.plan, subscription.customer);

  // Use the latest schedule change, which may exist in the case of a removed seat
  const latestSchedule = subscription.fixed_fee_quantity_schedule.reduce<
    Subscription["fixed_fee_quantity_schedule"][number] | null
  >((latest, f) => {
    if (f.price_id === priceId && (!latest || latest.start_date < f.start_date)) {
      return f;
    }

    return latest;
  }, null);
  return latestSchedule?.quantity || 0;
}

function getPlanSeatId(plan: Plan, customer?: Subscription["customer"]) {
  const priceId = plan.prices.find((p) => {
    return p.name === SEAT_ADD_ON_NAME;
  })?.id;
  try {
    assert(priceId, "Seat priceId not found");
  } catch (error) {
    console.error("Seat priceId not found", JSON.stringify({ plan, customer }));
    throw error;
  }
  return priceId;
}

function getPlanPrice(plan: Plan, priceName: string) {
  const price = plan.prices.find((p) => {
    return p.name === priceName;
  });
  assert(price, `Price for ${priceName} not found in plan`);
  return price;
}

export function getPlanIdFromType(planType: PlanType) {
  assert(typeof ORB_DEVELOPER_PLAN_ID === "string");
  assert(typeof ORB_STARTER_PLAN_ID === "string");
  assert(typeof ORB_PRO_PLAN_ID === "string");
  switch (planType) {
    case "developer":
      return ORB_DEVELOPER_PLAN_ID;
    case "starter":
      return ORB_STARTER_PLAN_ID;
    case "pro":
      return ORB_PRO_PLAN_ID;
    default:
      assertNever(planType);
  }
}

export function getPlanTypeFromId(planId: string) {
  if (planId === ORB_DEVELOPER_PLAN_ID) {
    return "developer";
  }
  if (planId === ORB_STARTER_PLAN_ID) {
    return "starter";
  }
  if (planId === ORB_PRO_PLAN_ID) {
    return "pro";
  }
  return undefined;
}

export async function isCurrentlyOnSubscription(subscription: PlanType, orbCustomerId: string) {
  const currentSubscription = await getSubscription(orbCustomerId);
  const planId = getPlanIdFromType(subscription);
  return currentSubscription?.plan?.id === planId;
}

// Get the current subscription for the orb customer
// This attempts to get the first non-default subscription.
// That can be either the active subscription, or an upcoming one.
// If all else fails, return null.
export async function getSubscription(orbCustomerId: string): Promise<Orb.Subscription | null> {
  const allSubscriptions = await getSubscriptions(orbCustomerId);
  const activeSubscriptions = allSubscriptions.filter((sub) => sub.status === "active");

  if (activeSubscriptions.length > 1) {
    console.warn("Multiple active subscriptions found", {
      orbCustomerId,
    });
  }

  if (activeSubscriptions.length !== 0) {
    return activeSubscriptions[0];
  }

  const upcomingSubscriptions = allSubscriptions.filter((sub) => sub.status === "upcoming");

  if (upcomingSubscriptions.length > 1) {
    console.warn("Multiple upcoming subscriptions found", { orbCustomerId });
  }

  if (upcomingSubscriptions.length !== 0) {
    return upcomingSubscriptions[0];
  }
  return null;
}
