import assert from "assert";

import { isAfter, compareAsc } from "date-fns";
import Orb from "orb-billing";

import { getCurrentPlan } from "@/lib/billing/tenant";
import { getSubscriptions } from "@/lib/orb";
import { getPricingPlansPath } from "@/lib/paths";
import { provisionBillingCustomer } from "@/lib/server/billing";
import { getRagieClientAndPartition } from "@/lib/server/ragie";
import { getMembersByTenantId } from "@/lib/server/service";
import { BILLING_ENABLED, DEFAULT_PARTITION_LIMIT, ORB_API_KEY } from "@/lib/server/settings";
import { adminOrRedirect } from "@/lib/server/utils";
import { getStripeCustomerDefaultPaymentMethod } from "@/lib/stripe";

import SettingsNav from "../settings-nav";

import BillingSettings from "./billing-settings";
import { EmptyBilling } from "./empty-billing";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BillingSettingsPage({ params }: Props) {
  const p = await params;
  const { tenant, session } = await adminOrRedirect(p.slug);
  const { client, partition } = await getRagieClientAndPartition(tenant.id);
  const partitionInfo = await client.partitions.get({ partitionId: partition });

  // Get tenant metadata and validate required fields
  const metadata = tenant.metadata;
  let stripeCustomerId;
  let orbCustomerId;
  let orbSubscriptionId;

  let mustProvisionBillingCustomer = true;

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
    mustProvisionBillingCustomer = false;
    stripeCustomerId = metadata.stripeCustomerId;
    orbCustomerId = metadata.orbCustomerId;
    orbSubscriptionId = metadata.orbSubscriptionId;
  }

  if (!metadata) {
    throw new Error("Tenant metadata not found");
  }
  assert(typeof tenant.id === "string", "Tenant ID not found");
  assert(typeof stripeCustomerId === "string", "Stripe customer ID not found");
  assert(typeof orbCustomerId === "string", "Orb customer ID not found");

  // Get Orb data
  const orb = new Orb({ apiKey: ORB_API_KEY });
  const invoiceRes = await orb.invoices.list({
    external_customer_id: tenant.id,
    status: ["issued", "paid", "synced"],
    limit: 100,
  });
  const invoices = invoiceRes.data;

  // Get subscription data
  const subscriptions = await getSubscriptions(orbCustomerId);
  const hasBillingHistory = subscriptions.length > 0;

  // Get Stripe data
  const defaultPaymentMethod = await getStripeCustomerDefaultPaymentMethod(stripeCustomerId);
  const serializedDefaultPaymentMethod = defaultPaymentMethod
    ? {
        id: defaultPaymentMethod.id,
        card: defaultPaymentMethod.card
          ? {
              brand: defaultPaymentMethod.card.brand,
              last4: defaultPaymentMethod.card.last4,
              exp_month: defaultPaymentMethod.card.exp_month,
              exp_year: defaultPaymentMethod.card.exp_year,
            }
          : null,
        billing_details: defaultPaymentMethod.billing_details,
        created: defaultPaymentMethod.created,
        type: defaultPaymentMethod.type,
      }
    : null;

  // Get current plan data
  const currentPlan = getCurrentPlan(metadata);

  // Calculate billing status
  const overdueInvoice = getOverdueInvoice(invoices);
  const nextPaymentDate = getNextPaymentDate(invoices);

  const { totalUsers, totalInvites } = await getMembersByTenantId(tenant.id, 1, 10);
  const userCount = Number(totalUsers) + Number(totalInvites);

  return (
    <div className="flex justify-center overflow-auto w-full h-full">
      <div className="max-w-[1140px] w-full p-4 flex-grow flex">
        <SettingsNav tenant={tenant} billingEnabled={BILLING_ENABLED} />
        {mustProvisionBillingCustomer || currentPlan?.name === "developer" ? (
          <EmptyBilling pricingPlansPath={getPricingPlansPath(tenant.slug)} />
        ) : (
          <BillingSettings
            tenant={{
              id: tenant.id,
              slug: tenant.slug,
              partitionLimitExceededAt: tenant.partitionLimitExceededAt,
              paidStatus: tenant.paidStatus,
              metadata: tenant.metadata ?? {},
            }}
            partitionInfo={partitionInfo}
            defaultPartitionLimit={DEFAULT_PARTITION_LIMIT}
            billingData={{
              hasBillingHistory,
              overdueInvoice,
              nextPaymentDate,
              defaultPaymentMethod: serializedDefaultPaymentMethod,
              currentPlan,
              invoices,
              subscriptions,
              userCount,
            }}
          />
        )}
      </div>
    </div>
  );
}

// Helper functions from BillingPage
function getOverdueInvoice(invoices: Orb.Invoice[]): Orb.Invoice | null {
  const now = new Date();
  const issuedInvoices = invoices.filter((i) => i.status === "issued");

  for (const invoice of issuedInvoices) {
    if (invoice.issued_at && isAfter(now, invoice.issued_at)) {
      return invoice;
    }
  }

  return null;
}

function getNextPaymentDate(invoices: Orb.Invoice[]): string | null {
  const draftInvoices = invoices.filter((i) => i.status === "draft" && !!i.scheduled_issue_at);
  const sortedInvoices = draftInvoices.sort((a, b) => compareAsc(a.scheduled_issue_at!, b.scheduled_issue_at!));

  if (sortedInvoices.length === 0) {
    return null;
  }

  return sortedInvoices[0].scheduled_issue_at;
}
