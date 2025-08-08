"use server";

import assert from "assert";

import assertNever from "assert-never";
import { addMonths, startOfMonth, differenceInDays } from "date-fns";
import Orb from "orb-billing";
import { Plan, Price, Subscription } from "orb-billing/resources/index.mjs";

import { getCurrentPlan, TenantPlan } from "./billing/tenant";
import { PlanType, SEAT_ADD_ON_NAME, SeatChangePreview } from "./orb-types";
import { getExistingMetadata } from "./server/billing";
import { getMembersByTenantId } from "./server/service";
import {
  ORB_API_KEY,
  ORB_DEVELOPER_PLAN_ID,
  ORB_PRO_ANNUAL_PLAN_ID,
  ORB_PRO_PLAN_ID,
  ORB_STARTER_PLAN_ID,
  ORB_PRO_SEATS_ONLY_PLAN_ID,
} from "./server/settings";
import { nowUtc } from "./utils";

export async function getSubscriptions(orbCustomerId: string) {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  const response = await orb.subscriptions.list({
    customer_id: [orbCustomerId],
  });
  return response.data;
}

export async function findUpcomingSeatQuantityChange(sub: any): Promise<number | null> {
  const seatPriceId = await getPlanSeatId(sub.plan, sub.customer);
  const upcomingSchedule = sub.fixed_fee_quantity_schedule?.find(
    (sched: any) => sched.price_id === seatPriceId && new Date(sched.start_date) > new Date(),
  );
  return upcomingSchedule ? parseInt(upcomingSchedule.quantity) : null;
}

export async function issueImmediateInvoices(subscriptionId: string): Promise<void> {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  const now = nowUtc();

  const invoices = await orb.invoices.list({
    subscription_id: subscriptionId,
    status: ["draft"],
    due_date: now.toISOString().split("T")[0],
  });

  console.log("Issuing due invoices", { invoices: invoices.data });

  for (const invoice of invoices.data) {
    if (parseFloat(invoice.amount_due) === 0) {
      continue;
    }

    try {
      console.log("Issuing invoice", { invoice });
      await orb.invoices.issue(invoice.id);
    } catch (error) {
      console.warn("Failed to issue invoice", { invoice, error });
      continue;
    }
  }
}

export async function updateSeats(orbSubscriptionId: string, seats: number) {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  const sub = await orb.subscriptions.fetch(orbSubscriptionId);
  assert(sub.plan, "Must have plan");
  const seatPriceId = await getPlanSeatId(sub.plan, sub.customer);
  let periodQuantity = seats;

  // is there an upcoming quantity change?
  const upcomingQuantityChange = await findUpcomingSeatQuantityChange(sub);
  if (upcomingQuantityChange) {
    periodQuantity += periodQuantity - upcomingQuantityChange;
  }

  await orb.subscriptions.updateFixedFeeQuantity(orbSubscriptionId, {
    price_id: seatPriceId,
    quantity: periodQuantity,
    change_option: "immediate",
  });

  if (upcomingQuantityChange) {
    await orb.subscriptions.unscheduleFixedFeeQuantityUpdates(orbSubscriptionId, {
      price_id: seatPriceId,
    });

    await orb.subscriptions.updateFixedFeeQuantity(orbSubscriptionId, {
      price_id: seatPriceId,
      quantity: seats,
      change_option: "upcoming_invoice",
    });
  }

  await issueImmediateInvoices(orbSubscriptionId);
}

export async function changePlan(
  nextPlanType: PlanType,
  preview: boolean = false,
  isCurrentlyOnFreeTier: boolean = false,
  tenant: {
    id: string;
    metadata: {
      stripeCustomerId: string;
      orbCustomerId: string;
      orbSubscriptionId?: string;
    };
  },
): Promise<Orb.Subscription> {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  if (!tenant.metadata.orbSubscriptionId) {
    throw new Error("Orb subscription ID not found");
  }

  const sub = await orb.subscriptions.fetch(tenant.metadata.orbSubscriptionId);

  let seatCount = 0;
  // Users are not able to purchase seats on free tier
  // If users are upgrading from free tier, they may have multiple users with 0 seats in the Orb plan
  // We need to make them pay for all active users upon plan upgrade
  if (isCurrentlyOnFreeTier) {
    const { totalUsers, totalInvites } = await getMembersByTenantId(tenant.id, 1, 10);
    seatCount = totalUsers + totalInvites;
  } else {
    seatCount = await getUpcomingSubscriptionSeatCount(sub);
  }

  const currPlan = sub.plan;
  if (!currPlan) {
    throw new Error("Current plan not found");
  }

  const nextPlanId = await getPlanIdFromType(nextPlanType as PlanType);
  assert(nextPlanId, "Next plan ID not found");
  const nextPlan = await orb.plans.fetch(nextPlanId);
  const seatPriceId = await getPlanSeatId(nextPlan, sub.customer);

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
  const priceId = await getPlanSeatId(subscription.plan, subscription.customer);

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

export async function getPlanSeatId(plan: Plan, customer?: Subscription["customer"]) {
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

export async function getPlanIdFromType(planType: PlanType) {
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
    case "proAnnual":
      return ORB_PRO_ANNUAL_PLAN_ID;
    case "proSeatsOnly":
      return ORB_PRO_SEATS_ONLY_PLAN_ID;
    default:
      assertNever(planType);
  }
}

export async function getPlanTypeFromId(planId: string) {
  switch (planId) {
    case ORB_DEVELOPER_PLAN_ID:
      return "developer";
    case ORB_STARTER_PLAN_ID:
      return "starter";
    case ORB_PRO_PLAN_ID:
      return "pro";
    case ORB_PRO_ANNUAL_PLAN_ID:
      return "proAnnual";
    case ORB_PRO_SEATS_ONLY_PLAN_ID:
      return "proSeatsOnly";
    default:
      return undefined;
  }
}

export async function isCurrentlyOnFreeTier(currentPlan: TenantPlan): Promise<boolean> {
  return currentPlan.name === "developer";
}

export async function getPlanById(planId: string) {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  const plan = await orb.plans.fetch(planId);
  return plan;
}

export async function isCurrentlyOnSubscription(subscription: PlanType, orbCustomerId: string) {
  const currentSubscription = await getSubscription(orbCustomerId);
  const planId = await getPlanIdFromType(subscription);
  assert(planId, "Plan ID not found");
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

// HACK: The Orb API can preview changes by providing headers these "Include-Changed-Resources": "true", "Dry-Run": "true"
//       Unfortunately those headers are incompatible with setting an idempotency key,
//       and it is not possible to unset the idempotency key in the Orb API client.
async function _dryRunQuantityChange({
  subscriptionId,
  priceId,
  quantity,
  changeOption,
}: {
  subscriptionId: string;
  priceId: string;
  quantity: number;
  changeOption: "immediate" | "upcoming_invoice";
}) {
  return await fetch(`https://api.withorb.com/v1/subscriptions/${subscriptionId}/update_fixed_fee_quantity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ORB_API_KEY}`,
      "Include-Changed-Resources": "true",
      "Dry-Run": "true",
    },
    body: JSON.stringify({
      price_id: priceId,
      change_option: changeOption,
      quantity: quantity,
    }),
  });
}

export async function previewSeatChange(
  tenantId: string,
  orbCustomerId: string,
  nextCount: number,
  changeOption: "immediate" | "upcoming_invoice" = "immediate",
) {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  assert(orbCustomerId, "Must have orbCustomerId");
  const existingMetadata = await getExistingMetadata(tenantId);
  assert(existingMetadata, "Must have existing metadata");
  const currentPlan = getCurrentPlan(existingMetadata);
  assert(currentPlan, "Must have current plan");
  const currentPlanSeats = currentPlan.seats;
  const currentPlanAsPlan = await getPlanById(currentPlan.tier);
  assert(currentPlanAsPlan, "Failed to fetch plan from Orb");

  const orbSubscriptionId = existingMetadata.orbSubscriptionId;
  assert(orbSubscriptionId, "Must have subscription ID");

  const seatPriceId = await getPlanSeatId(currentPlanAsPlan);

  const originalUpcomingInvoices = await orb.invoices.list({
    subscription_id: currentPlan.id,
    status: ["draft"],
    "due_date[gt]": nowUtc().toISOString().split("T")[0],
  });
  const originalUpcomingInvoice = await selectUpcomingInvoice(originalUpcomingInvoices.data, seatPriceId);
  const daysLeftInCurrentBillingCycle = differenceInDays(
    originalUpcomingInvoice && originalUpcomingInvoice.due_date
      ? new Date(originalUpcomingInvoice.due_date)
      : addMonths(startOfMonth(nowUtc()), 1),
    nowUtc(),
  );

  // The ragieBilledCount is how many embedded connectors we are currently billing for
  // excluding those that have been cancelled. The currentPeriodBilledCount is how many
  // orb is billing in the current period. If that is greater than there is a cancellation
  // this period. When previewing we need to take that into account, since this period
  // will include that quantity and not generate an immediate invoice.
  const currentPeriodBilledCount = await getCurrentSubscriptionSeatCount(orbSubscriptionId);

  const cancelledCount = currentPeriodBilledCount - currentPlanSeats;
  const hasPendingQuantityChange = cancelledCount !== 0;
  const orbNextCount = nextCount;
  const adjustedNextCount = hasPendingQuantityChange ? nextCount + cancelledCount : nextCount;

  if (adjustedNextCount <= 0) {
    return {
      immediateInvoice: null,
      upcomingInvoice: originalUpcomingInvoice,
      currentSeatCharge: originalUpcomingInvoice
        ? await selectSeatChargeFromInvoice(currentPlanAsPlan, originalUpcomingInvoice)
        : 0,
      immediateSeatCharge: 0,
      upcomingSeatCharge: 0,
      daysLeftInCurrentBillingCycle: 0,
      availableSeatCount: -1,
      allowedSeatCount: -1,
    } as SeatChangePreview;
  }

  const updatedSubRes = await _dryRunQuantityChange({
    subscriptionId: orbSubscriptionId,
    priceId: seatPriceId,
    quantity: adjustedNextCount,
    changeOption,
  });
  const updatedSub = await updatedSubRes.json();

  const immediateInvoice = updatedSub.changed_resources?.created_invoices
    ? await selectImmediateDueInvoice(updatedSub.changed_resources.created_invoices, seatPriceId)
    : null;
  let upcomingInvoice = await selectUpcomingInvoice(updatedSub.changed_resources?.created_invoices || [], seatPriceId);
  if (!upcomingInvoice) {
    const upcomingInvoices = await orb.invoices.list({
      subscription_id: updatedSub.id,
      status: ["draft"],
      "due_date[gt]": nowUtc().toISOString().split("T")[0],
    });
    upcomingInvoice = await selectUpcomingInvoice(upcomingInvoices.data, seatPriceId);
  }

  // If there is a pending cancellation, from the user's perspective their current embedded connector's charge
  // is actually their upcoming charge
  const currentSeatCharge =
    hasPendingQuantityChange && originalUpcomingInvoice
      ? await selectSeatChargeFromInvoice(currentPlanAsPlan, originalUpcomingInvoice)
      : await selectSeatChargeFromSubscription(orbSubscriptionId);
  const immediateSeatCharge = immediateInvoice
    ? await selectSeatChargeFromInvoice(currentPlanAsPlan, immediateInvoice)
    : 0;
  const nextPeriodChangeRes = await _dryRunQuantityChange({
    subscriptionId: orbSubscriptionId,
    priceId: seatPriceId,
    quantity: orbNextCount,
    changeOption: "upcoming_invoice",
  });
  const nextPeriodChange = await nextPeriodChangeRes.json();
  const upcomingChangeInvoice = await selectUpcomingInvoice(
    nextPeriodChange.changed_resources?.created_invoices || [],
    seatPriceId,
  );
  let upcomingSeatCharge = 0;
  if (upcomingChangeInvoice) {
    upcomingSeatCharge = await selectSeatChargeFromInvoice(currentPlanAsPlan, upcomingChangeInvoice);
  } else if (upcomingInvoice) {
    upcomingSeatCharge = await selectSeatChargeFromInvoice(currentPlanAsPlan, upcomingInvoice);
  }

  return {
    immediateInvoice,
    upcomingInvoice,
    currentSeatCharge,
    immediateSeatCharge,
    upcomingSeatCharge,
    daysLeftInCurrentBillingCycle,
    allowedSeatCount: -1,
    availableSeatCount: -1,
  } as SeatChangePreview;
}

async function selectImmediateDueInvoice(invoices: Orb.Invoices.Invoice[], requiredPriceId?: string) {
  const now = nowUtc();
  // Find the latest due invoice that has a total greater than 0
  const dueInvoice = invoices.reduce<null | Orb.Invoices.Invoice>((latest, i) => {
    if (
      i.due_date &&
      i.due_date <= now.toISOString() &&
      (!requiredPriceId || i.line_items.some((li) => li.price?.id === requiredPriceId))
    ) {
      if (!latest) {
        return i;
      }

      if (latest.due_date && i.due_date && latest.due_date < i.due_date) {
        return i;
      }
    }

    return latest;
  }, null);
  return dueInvoice;
}

async function selectUpcomingInvoice(invoices: Orb.Invoices.Invoice[], requiredPriceId?: string) {
  const now = nowUtc();
  // Find the next invoice that has a total greater than 0
  const nextInvoice = invoices.reduce<null | Orb.Invoices.Invoice>((next, i) => {
    if (
      i.due_date &&
      i.due_date > now.toISOString() &&
      (!requiredPriceId || i.line_items.some((li) => li.price?.id === requiredPriceId))
    ) {
      if (next === null) {
        return i;
      }

      if (next.due_date && i.due_date && next.due_date > i.due_date) {
        return i;
      }
    }

    return next;
  }, null);
  return nextInvoice;
}

async function selectSeatChargeFromInvoice(plan: Plan, invoice: Orb.Invoices.Invoice) {
  const seatPriceId = await getPlanSeatId(plan, invoice.customer as any);
  return invoice.line_items.reduce((total, lineItem) => {
    if (lineItem.price?.id === seatPriceId) {
      return total + parseFloat(lineItem.amount);
    }

    return total;
  }, 0);
}

async function selectSeatChargeFromSubscription(orbSubscriptionId: string) {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  const subscription = await orb.subscriptions.fetch(orbSubscriptionId);
  assert(subscription.plan, "Must have plan");
  const now = nowUtc();
  const seatPriceId = await getPlanSeatId(subscription.plan, subscription.customer);
  const seatPrice = (subscription.plan.prices as any).find((p: Price) => p.id === seatPriceId)?.unit_config.unit_amount;
  const currentPriceInterval = subscription.price_intervals.find(
    (pi) =>
      pi.price.id === seatPriceId &&
      pi.start_date <= now.toISOString() &&
      (!pi.end_date || pi.end_date >= now.toISOString()),
  );
  const currentQuantity =
    currentPriceInterval?.fixed_fee_quantity_transitions?.reduce<any | null>((currTransition, fqt) => {
      if (
        currTransition === null ||
        (currTransition.effective_date < fqt.effective_date && fqt.effective_date <= now.toISOString())
      ) {
        return fqt;
      }

      return currTransition;
    }, null)?.quantity || 0;
  return seatPrice * currentQuantity;
}

export async function getCurrentSubscriptionSeatCount(orbSubscriptionId: string) {
  const orb = new Orb({ apiKey: ORB_API_KEY });
  const sub = await orb.subscriptions.fetch(orbSubscriptionId);
  assert(sub.plan, "Must have plan");

  const seatPriceId = await getPlanSeatId(sub.plan, sub.customer);
  const nowIso = nowUtc().toISOString();

  const fixedFeeQuantity = sub.fixed_fee_quantity_schedule.find((f) => {
    return f.price_id === seatPriceId && f.start_date <= nowIso && (!f.end_date || f.end_date >= nowIso);
  });
  if (!fixedFeeQuantity) {
    return 0;
  }
  return fixedFeeQuantity.quantity;
}
