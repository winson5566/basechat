"use client";

import { getBillingSettingsPath } from "@/lib/paths";

import { Card } from "../ui/card";

import PaymentMethodCard from "./payment-method-card";

interface Props {
  hasControls?: boolean;
  className?: string;
  defaultPaymentMethod: any;
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
    return <Card className={className}>There is an error with your account. Please contact support.</Card>;
  }
}
