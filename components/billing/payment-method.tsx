"use client";

import Stripe from "stripe";

import { getBillingSettingsPath } from "@/lib/paths";

import { Card } from "../ui/card";

import PaymentMethodCard from "./payment-method-card";

interface Props {
  hasControls?: boolean;
  className?: string;
  defaultPaymentMethod: {
    id: string;
    card: Stripe.PaymentMethod.Card | null;
    billing_details: any;
    created: number;
    type: string;
  } | null;
  tenant: { slug: string };
}

export default function PaymentMethod({ hasControls = true, defaultPaymentMethod, className, tenant }: Props) {
  try {
    return (
      <PaymentMethodCard
        className={className}
        hasControls={hasControls}
        card={defaultPaymentMethod?.card ?? null}
        billingPath={getBillingSettingsPath(tenant.slug)}
      />
    );
  } catch (error) {
    console.error("Error rendering payment method:", error);
    return <Card className={className}>There is an error with your account. Please contact support.</Card>;
  }
}
