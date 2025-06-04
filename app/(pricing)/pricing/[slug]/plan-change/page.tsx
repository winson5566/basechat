import assert from "assert";

import { CreditNote } from "orb-billing/resources/credit-notes.mjs";
import { Invoice } from "orb-billing/resources/invoices.mjs";

import { H1 } from "@/components/ui/typography";
import { getCurrentPlan } from "@/lib/billing/tenant";
import { changePlan, getPlanIdFromType } from "@/lib/orb";
import { planTypeSchema, PLANS } from "@/lib/orb-types";
import { provisionBillingCustomer } from "@/lib/server/billing";
import { BASE_URL, NEXT_PUBLIC_STRIPE_PUBLIC_KEY } from "@/lib/server/settings";
import { requireAdminContext } from "@/lib/server/utils";
import { getStripeCustomer } from "@/lib/stripe";
import { startOfDayUtc } from "@/lib/utils";

import UpgradePlanContent from "./content";

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
  params: { slug: string };
}

export default async function UpgradePlan({ searchParams, params }: Props) {
  const planType = planTypeSchema.parse(searchParams["plan-type"]);
  const targetPlan = PLANS[planType];
  assert(targetPlan, "Target plan not found");
  const { tenant, session } = await requireAdminContext(params.slug);
  const metadata = tenant.metadata;

  let stripeCustomerId;
  let orbCustomerId;
  let orbSubscriptionId;

  if (!metadata || !metadata.stripeCustomerId || !metadata.orbCustomerId || !metadata.orbSubscriptionId) {
    const { newStripeCustomerId, newOrbCustomerId, newOrbSubscriptionId } = await provisionBillingCustomer(
      tenant.id,
      session.user.name,
      session.user.email,
    );
    stripeCustomerId = newStripeCustomerId;
    orbCustomerId = newOrbCustomerId;
    orbSubscriptionId = newOrbSubscriptionId;
  } else {
    stripeCustomerId = metadata.stripeCustomerId;
    orbCustomerId = metadata.orbCustomerId;
    orbSubscriptionId = metadata.orbSubscriptionId;
  }
  assert(typeof stripeCustomerId === "string", "Stripe customer ID not found");
  assert(typeof orbCustomerId === "string", "Orb customer ID not found");
  assert(typeof orbSubscriptionId === "string", "Orb subscription ID not found");

  const currentPlan = metadata ? getCurrentPlan(metadata) : null;
  const currentSeatCount = currentPlan?.seats ?? 0;

  const customer = await getStripeCustomer(stripeCustomerId);
  if (customer.deleted) {
    return (
      <div>
        <H1 className="pb-12">Error</H1>
        <p>There is an error with your account, please contact support.</p>
      </div>
    );
  }

  const tenantWithMetadata = {
    slug: tenant.slug,
    metadata: {
      stripeCustomerId,
      orbCustomerId,
      orbSubscriptionId,
    },
  };

  //TODO: ^ the stripe and orb info here in the metadata are from creation above, not from DB

  // Get preview of plan change
  const changePreview = await changePlan(targetPlan.planType, true, tenantWithMetadata);
  const previewInvoices = ((changePreview as any)?.changed_resources?.created_invoices || []).map(
    (invoice: Invoice) => ({
      id: invoice.id,
      due_date: invoice.due_date || "",
      total: invoice.total,
      amount_due: invoice.amount_due,
      line_items: invoice.line_items.map((item) => ({
        price: item.price
          ? {
              name: item.price.name,
            }
          : undefined,
      })),
    }),
  );
  const previewCreditNotes = ((changePreview as any)?.changed_resources?.created_credit_notes || []).map(
    (note: CreditNote) => ({
      total: note.total,
    }),
  );

  return (
    <div className="flex justify-center">
      <div>
        <H1 className="pb-12">Upgrade to {targetPlan.displayName}</H1>
        <UpgradePlanContent
          tenant={tenantWithMetadata}
          targetPlan={targetPlan}
          baseUrl={BASE_URL}
          publicStripeKey={NEXT_PUBLIC_STRIPE_PUBLIC_KEY}
          currentSeatCount={currentSeatCount}
          previewInvoices={previewInvoices}
          previewCreditNotes={previewCreditNotes}
          serverStartOfDay={startOfDayUtc()}
        />
      </div>
    </div>
  );
}
