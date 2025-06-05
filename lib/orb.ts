import assert from "assert";

import assertNever from "assert-never";
import { addDays, addMonths, startOfMonth, differenceInDays } from "date-fns";
import Orb from "orb-billing";
import { Plan, Price, Subscription, SubscriptionSchedulePlanChangeParams } from "orb-billing/resources/index.mjs";

import { getCurrentPlan } from "./billing/tenant";
import { PlanType, SEAT_ADD_ON_NAME, SeatChangePreview } from "./orb-types";
import { getExistingMetadata } from "./server/billing";
import { getMembersByTenantId } from "./server/service";
import { ORB_API_KEY, ORB_DEVELOPER_PLAN_ID, ORB_PRO_PLAN_ID, ORB_STARTER_PLAN_ID } from "./server/settings";
import { startOfDayUtc, nowUtc } from "./utils";

export async function getSubscriptions(orbCustomerId: string) {
  const orb = new Orb();
  const response = await orb.subscriptions.list({
    customer_id: [orbCustomerId],
  });
  return response.data;
}

export function findUpcomingSeatQuantityChange(sub: any): number | null {
  const seatPriceId = getPlanSeatId(sub.plan, sub.customer);
  const upcomingSchedule = sub.fixed_fee_quantity_schedule?.find(
    (sched: any) => sched.price_id === seatPriceId && new Date(sched.start_date) > new Date(),
  );
  return upcomingSchedule ? parseInt(upcomingSchedule.quantity) : null;
}

export async function issueImmediateInvoices(subscriptionId: string): Promise<void> {
  const orb = new Orb();
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
  const orb = new Orb();
  const sub = await orb.subscriptions.fetch(orbSubscriptionId);
  assert(sub.plan, "Must have plan");
  const seatPriceId = getPlanSeatId(sub.plan, sub.customer);
  let periodQuantity = seats;

  // is there an upcoming quantity change?
  const upcomingQuantityChange = findUpcomingSeatQuantityChange(sub);
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
  //   if (seatCount > 0 && (currSeatPrice as any).unit_config.unit_amount > 0) { // TODO: commented this out
  //     adjustments.push({
  //       adjustment: {
  //         applies_to_price_ids: [seatPriceId],
  //         adjustment_type: "amount_discount",
  //         amount_discount: String(seatCount * (nextSeatPrice as any).unit_config.unit_amount),
  //       },
  //       end_date: addDays(startOfDayUtc(), 1).toISOString(),
  //     });
  //   }

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

export function getPlanSeatId(plan: Plan, customer?: Subscription["customer"]) {
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

export async function getPlanById(planId: string) {
  const orb = new Orb();
  const plan = await orb.plans.fetch(planId);
  return plan;
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
  const orb = new Orb();
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

  const seatPriceId = getPlanSeatId(currentPlanAsPlan);

  const originalUpcomingInvoices = await orb.invoices.list({
    subscription_id: currentPlan.id,
    status: ["draft"],
    "due_date[gt]": nowUtc().toISOString().split("T")[0],
  });
  const originalUpcomingInvoice = selectUpcomingInvoice(originalUpcomingInvoices.data, seatPriceId);
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
  if (hasPendingQuantityChange) {
    nextCount = nextCount + cancelledCount;
  }

  if (nextCount <= 0) {
    return {
      immediateInvoice: null,
      upcomingInvoice: originalUpcomingInvoice,
      currentSeatCharge: originalUpcomingInvoice
        ? selectSeatChargeFromInvoice(currentPlanAsPlan, originalUpcomingInvoice)
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
    quantity: nextCount,
    changeOption,
  });
  const updatedSub = await updatedSubRes.json();

  const immediateInvoice = updatedSub.changed_resources?.created_invoices
    ? selectImmediateDueInvoice(updatedSub.changed_resources.created_invoices, seatPriceId)
    : null;
  let upcomingInvoice = selectUpcomingInvoice(updatedSub.changed_resources?.created_invoices || [], seatPriceId);
  if (!upcomingInvoice) {
    const upcomingInvoices = await orb.invoices.list({
      subscription_id: updatedSub.id,
      status: ["draft"],
      "due_date[gt]": nowUtc().toISOString().split("T")[0],
    });
    upcomingInvoice = selectUpcomingInvoice(upcomingInvoices.data, seatPriceId);
  }

  // If there is a pending cancellation, from the user's perspective their current embedded connector's charge
  // is actually their upcoming charge
  const currentSeatCharge =
    hasPendingQuantityChange && originalUpcomingInvoice
      ? selectSeatChargeFromInvoice(currentPlanAsPlan, originalUpcomingInvoice)
      : await selectSeatChargeFromSubscription(orbSubscriptionId);
  const immediateSeatCharge = immediateInvoice ? selectSeatChargeFromInvoice(currentPlanAsPlan, immediateInvoice) : 0;
  const nextPeriodChangeRes = await _dryRunQuantityChange({
    subscriptionId: orbSubscriptionId,
    priceId: seatPriceId,
    quantity: orbNextCount,
    changeOption: "upcoming_invoice",
  });
  const nextPeriodChange = await nextPeriodChangeRes.json();
  const upcomingChangeInvoice = selectUpcomingInvoice(
    nextPeriodChange.changed_resources?.created_invoices || [],
    seatPriceId,
  );
  let upcomingSeatCharge = 0;
  if (upcomingChangeInvoice) {
    upcomingSeatCharge = selectSeatChargeFromInvoice(currentPlanAsPlan, upcomingChangeInvoice);
  } else if (upcomingInvoice) {
    upcomingSeatCharge = selectSeatChargeFromInvoice(currentPlanAsPlan, upcomingInvoice);
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

function selectImmediateDueInvoice(invoices: Orb.Invoices.Invoice[], requiredPriceId?: string) {
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

function selectUpcomingInvoice(invoices: Orb.Invoices.Invoice[], requiredPriceId?: string) {
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

function selectSeatChargeFromInvoice(plan: Plan, invoice: Orb.Invoices.Invoice) {
  const seatPriceId = getPlanSeatId(plan, invoice.customer as any);
  return invoice.line_items.reduce((total, lineItem) => {
    if (lineItem.price?.id === seatPriceId) {
      return total + parseFloat(lineItem.amount);
    }

    return total;
  }, 0);
}

async function selectSeatChargeFromSubscription(orbSubscriptionId: string) {
  const orb = new Orb();
  const subscription = await orb.subscriptions.fetch(orbSubscriptionId);
  assert(subscription.plan, "Must have plan");
  const now = nowUtc();
  const seatPriceId = getPlanSeatId(subscription.plan, subscription.customer);
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
  const orb = new Orb();
  const sub = await orb.subscriptions.fetch(orbSubscriptionId);
  assert(sub.plan, "Must have plan");

  const seatPriceId = getPlanSeatId(sub.plan, sub.customer);
  const nowIso = nowUtc().toISOString();

  const fixedFeeQuantity = sub.fixed_fee_quantity_schedule.find((f) => {
    return f.price_id === seatPriceId && f.start_date <= nowIso && (!f.end_date || f.end_date >= nowIso);
  });
  if (!fixedFeeQuantity) {
    return 0;
  }
  return fixedFeeQuantity.quantity;
}
