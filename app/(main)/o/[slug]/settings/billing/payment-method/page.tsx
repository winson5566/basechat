import assert from "assert";

import { getBillingSettingsPath } from "@/lib/paths";
import { BILLING_ENABLED, BASE_URL, NEXT_PUBLIC_STRIPE_PUBLIC_KEY } from "@/lib/server/settings";
import { requireAdminContext } from "@/lib/server/utils";
import { getStripeCustomerDefaultPaymentMethod, listStripeCustomerPaymentMethods } from "@/lib/stripe";

import SettingsNav from "../../settings-nav";

import PaymentMethodContent from "./payment-method-content";

export default async function PaymentMethodPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const { tenant } = await requireAdminContext(p.slug);
  const { stripeCustomerId } = tenant.metadata || {};
  assert(typeof stripeCustomerId === "string", "Stripe customer ID not found");
  const defaultPaymentMethod = await getStripeCustomerDefaultPaymentMethod(stripeCustomerId);
  const paymentMethods = await listStripeCustomerPaymentMethods(stripeCustomerId);

  return (
    <div className="flex justify-center overflow-auto w-full">
      <div className="max-w-[1140px] w-full p-4 flex-grow flex">
        <SettingsNav tenant={tenant} billingEnabled={BILLING_ENABLED} />
        <PaymentMethodContent
          billingUrl={BASE_URL + getBillingSettingsPath(tenant.slug)}
          publicStripeKey={NEXT_PUBLIC_STRIPE_PUBLIC_KEY}
          paymentMethods={paymentMethods}
          defaultPaymentMethodId={defaultPaymentMethod?.id ?? null}
          stripeCustomerId={stripeCustomerId}
        />
      </div>
    </div>
  );
}
