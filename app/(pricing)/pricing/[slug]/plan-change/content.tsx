"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { format, isBefore, isEqual, isAfter } from "date-fns";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import Stripe from "stripe";

import { CreditCardInfo } from "@/components/billing/credit-card-info";
import PlanCardRadio from "@/components/billing/plan-card-radio";
import { StripeElementsWrapper } from "@/components/billing/stripe-elements-wrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SEAT_ADD_ON_NAME, SEAT_COST, PlanDef, PLANS } from "@/lib/orb-types";
import { getBillingSettingsPath, getPricingPlanChangePath, getTenantPath } from "@/lib/paths";
import {
  createStripeSetupIntent,
  getStripeCustomerDefaultPaymentMethod,
  setStripeDefaultInvoicePaymentMethod,
} from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface Props {
  tenant: {
    slug: string;
    metadata: {
      stripeCustomerId: string;
      orbCustomerId: string;
      orbSubscriptionId?: string;
    };
  };
  baseUrl: string;
  publicStripeKey: string;
  targetPlan: PlanDef;
  currentSeatCount: number;
  serverStartOfDay: Date;
  previewInvoices: Array<{
    id: string;
    due_date: string;
    total: string;
    amount_due: string;
    line_items: Array<{
      price?: {
        name: string;
      };
    }>;
  }>;
  previewCreditNotes: Array<{
    total: string;
  }>;
}

export default function UpgradePlanContent({
  tenant,
  baseUrl,
  publicStripeKey,
  targetPlan,
  currentSeatCount,
  previewInvoices,
  serverStartOfDay,
  previewCreditNotes,
}: Props) {
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<Stripe.PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDefaultPaymentMethod = async () => {
      const method = await getStripeCustomerDefaultPaymentMethod(tenant.metadata.stripeCustomerId);
      setDefaultPaymentMethod(method);
      setLoading(false);
    };

    loadDefaultPaymentMethod();
  }, [tenant.metadata.stripeCustomerId]);

  return (
    <StripeElementsWrapper
      stripePublishableKey={publicStripeKey}
      loadingElement={<Skeleton className="w-[400px] h-[200px] rounded" />}
    >
      {loading ? (
        <Skeleton className="w-[400px] h-[200px] rounded" />
      ) : (
        <UpgradePlanContentInner
          tenant={tenant}
          baseUrl={baseUrl}
          billingCycles={["monthly"]}
          defaultPaymentMethod={defaultPaymentMethod}
          targetPlan={targetPlan}
          currentSeatCount={currentSeatCount}
          previewInvoices={previewInvoices}
          previewCreditNotes={previewCreditNotes}
          serverStartOfDay={serverStartOfDay}
        />
      )}
    </StripeElementsWrapper>
  );
}

interface InnerProps {
  tenant: {
    slug: string;
    metadata: {
      stripeCustomerId: string;
      orbCustomerId: string;
      orbSubscriptionId?: string;
    };
  };
  baseUrl: string;
  billingCycles: Array<"annual" | "monthly">;
  defaultPaymentMethod: Stripe.PaymentMethod | null;
  targetPlan: PlanDef;
  className?: string;
  currentSeatCount: number;
  serverStartOfDay: Date;
  previewInvoices: Array<{
    id: string;
    due_date: string;
    total: string;
    amount_due: string;
    line_items: Array<{
      price?: {
        name: string;
      };
    }>;
  }>;
  previewCreditNotes: Array<{
    total: string;
  }>;
}

export function UpgradePlanContentInner({
  tenant,
  baseUrl,
  billingCycles,
  defaultPaymentMethod,
  targetPlan: targetPlanProp,
  currentSeatCount,
  serverStartOfDay,
  previewInvoices,
  previewCreditNotes,
  className,
}: InnerProps) {
  const router = useRouter();
  const [targetPlanType, setTargetPlanType] = useState(targetPlanProp.planType);
  const targetPlan = PLANS[targetPlanType];
  const annualPlan = targetPlan.billingCycle === "annual" ? targetPlan : PLANS[targetPlan.alternateCycleType!];
  const monthlyPlan = targetPlan.billingCycle === "monthly" ? targetPlan : PLANS[targetPlan.alternateCycleType!];
  const [loading, setLoading] = useState(false);
  const costPerMonth = targetPlan.billingCycle === "monthly" ? targetPlan.price : targetPlan.price / 12;
  const months = targetPlan.billingCycle === "monthly" ? 1 : 12;
  const seatMonthlyCost = currentSeatCount * SEAT_COST;

  const [addingNewPaymentMethod, setAddingNewPaymentMethod] = useState(defaultPaymentMethod === null);

  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    if (addingNewPaymentMethod) {
      try {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          toast.error(submitError.message);
          setLoading(false);
          return;
        }
        const setupIntent = await createStripeSetupIntent(tenant.metadata.stripeCustomerId);
        const returnUrl = `${baseUrl}${getBillingSettingsPath(tenant.slug)}/payment-method-redirect`;

        const { setupIntent: confirmIntent, error } = await stripe.confirmSetup({
          elements,
          clientSecret: setupIntent.client_secret!,
          redirect: "if_required",
          confirmParams: {
            return_url: returnUrl, // TODO:, is this the right redirect?
          },
        });
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        if (confirmIntent && confirmIntent.payment_method) {
          const paymentMethod = confirmIntent.payment_method;
          await setStripeDefaultInvoicePaymentMethod(
            tenant.metadata.stripeCustomerId,
            typeof paymentMethod === "string" ? paymentMethod : paymentMethod.id,
          );
        }
      } catch (err: unknown) {
        console.error(err);
        toast.error("Something went wrong. Please try again later");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/billing/plan-change", {
        method: "POST",
        headers: {
          tenant: tenant.slug,
        },
        body: JSON.stringify({
          planType: targetPlan.planType,
        }),
      });

      console.log("response", response);

      if (response.status === 400) {
        const error = await response.json();
        toast.error(error.error || "You are already on that plan");
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change plan");
      }

      toast.success("You have successfully changed your plan");
      router.push(getTenantPath(tenant.slug));
    } catch (err: unknown) {
      toast.error("Unable to switch plans. Please contact support");
      console.error(err);
    }

    setLoading(false);
  };

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const dueInvoice = previewInvoices.find(
    (invoice) =>
      invoice.due_date &&
      (isEqual(new Date(invoice.due_date), serverStartOfDay) ||
        isBefore(new Date(invoice.due_date), serverStartOfDay)) &&
      parseFloat(invoice.total) > 0,
  );
  const nextInvoice = previewInvoices.reduce<(typeof previewInvoices)[0] | null>((acc, invoice) => {
    if (
      invoice.due_date &&
      isAfter(new Date(invoice.due_date), serverStartOfDay) &&
      invoice.line_items.some((li) => li.price?.name === SEAT_ADD_ON_NAME)
    ) {
      if (!acc || (acc.due_date && isBefore(new Date(invoice.due_date), new Date(acc.due_date)))) {
        return invoice;
      }
    }
    return acc;
  }, null);

  if (!dueInvoice || !nextInvoice) {
    return (
      <div>
        Error: Unable to load invoice information
        {dueInvoice ? "due invoice" : "no due invoice"}
        {nextInvoice ? "next invoice" : "no next invoice"}
      </div>
    );
  }

  return (
    <form className={cn("flex", className)} onSubmit={handleSubmit}>
      <div className="pr-8">
        <div className="text-base mb-2">Choose a plan:</div>
        <div className="flex gap-4 min-w-[560px]">
          {billingCycles.includes("annual") && (
            <PlanCardRadio
              title="Yearly"
              description="Billed yearly"
              costPerMonth={annualPlan.price / 12}
              selected={targetPlan.billingCycle === "annual" || billingCycles.length == 1}
              className="grow shrink-0 basis-0"
              badge={"-10%"}
              value="annual"
              onClick={() => {
                setTargetPlanType(annualPlan.planType);
                router.push(`${getPricingPlanChangePath(tenant.slug)}?plan-type=${annualPlan.planType}`);
              }}
            />
          )}
          {billingCycles.includes("monthly") && (
            <PlanCardRadio
              title="Monthly"
              description="Billed monthly"
              costPerMonth={monthlyPlan.price}
              selected={targetPlan.billingCycle === "monthly" || billingCycles.length == 1}
              className="grow shrink-0 basis-0"
              value="monthly"
              onClick={() => {
                router.push(`${getPricingPlanChangePath(tenant.slug)}?plan-type=${monthlyPlan.planType}`);
                setTargetPlanType(monthlyPlan.planType!);
              }}
            />
          )}
        </div>
        <hr className="my-6" />
        <div className="flex justify-between text-base mb-2">
          <span>Billing and Payment</span>
          {!addingNewPaymentMethod && (
            <Button variant="link" className="text-accent-active" onClick={() => setAddingNewPaymentMethod(true)}>
              Use a different credit card
            </Button>
          )}
          {addingNewPaymentMethod && !!defaultPaymentMethod && (
            <Button variant="link" className="text-accent-active" onClick={() => setAddingNewPaymentMethod(false)}>
              Cancel
            </Button>
          )}
        </div>
        <div>
          {!addingNewPaymentMethod && defaultPaymentMethod && defaultPaymentMethod.card && (
            <div className="bg-card p-4 rounded-lg">
              <CreditCardInfo card={defaultPaymentMethod.card} />
            </div>
          )}
          {addingNewPaymentMethod && (
            <div className="w-[500px] mt-4">
              <PaymentElement />
            </div>
          )}
        </div>
      </div>
      <div className="min-w-[280px] max-w-[340px] p-4 border-l">
        <div className="text-base mb-4">Summary</div>
        <div className="text-sm flex justify-between">
          <span>{targetPlan.displayName} plan</span>
          <span>{currencyFormatter.format(costPerMonth)} /month</span>
        </div>
        {targetPlan.billingCycle === "annual" && (
          <div className="text-sm flex justify-between mt-1">
            <span>Months</span>
            <span>x {months}</span>
          </div>
        )}

        {currentSeatCount > 0 && (
          <div className="text-sm flex justify-between mt-4">
            <span>Seats ({currentSeatCount})</span>
            <span>{currencyFormatter.format(seatMonthlyCost)} /month</span>
          </div>
        )}

        <hr className="my-6" />
        <div className="text-sm flex justify-between">
          <span>Base monthly starting {nextInvoice.due_date && format(new Date(nextInvoice.due_date), "M/d/yy")} </span>
          <span>${nextInvoice.amount_due} /month</span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm">Total due today</span>
          <span className="font-bold">${dueInvoice?.amount_due}</span>
        </div>
        {previewCreditNotes.length > 0 && (
          <div className="flex justify-between items-center mt-3 text-sm">
            <span>Refund on last plan</span>
            <span>${previewCreditNotes[0].total}</span>
          </div>
        )}
        <FinePrint targetPlan={targetPlan} nextInvoice={nextInvoice} />
        <Button type="submit" className="w-full mt-4" loading={loading} disabled={loading || !stripe}>
          Upgrade to {targetPlan.displayName}
        </Button>
      </div>
    </form>
  );
}

function FinePrint({
  targetPlan,
  nextInvoice,
}: {
  targetPlan: PlanDef;
  nextInvoice: {
    due_date: string;
  };
}) {
  let invoicingTerms = "";
  if (targetPlan.billingCycle === "monthly") {
    invoicingTerms = "Your next monthly invoice will include your Base Fee plus usage costs from the previous month, ";
  } else if (targetPlan.billingCycle === "annual") {
    invoicingTerms =
      "Your next annual invoice will include your Platform Fee. Your base fee and previous month's usage will be invoiced monthly, ";
  } else {
    throw new Error("Unknown billing cycle");
  }
  return (
    <p className="mt-6 text-xs text-muted-foreground">
      By clicking &quot;Upgrade to {targetPlan.displayName}&quot;, you agree to Ragie&apos;s{" "}
      <a href="https://www.ragie.ai/terms-of-service" target="_blank" className="underline">
        Terms of Use
      </a>
      , and that Ragie will charge you the total amount due today. {invoicingTerms} starting{" "}
      {nextInvoice.due_date && format(new Date(nextInvoice.due_date), "LLLL d, yyyy")} until cancelled.
    </p>
  );
}
