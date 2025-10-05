"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import WarningMessage from "@/components/warning-message";
import { getPricingPlansPath } from "@/lib/paths";

import { getBillingInfo } from "./actions";
import BillingSettings from "./billing-settings";
import { EmptyBilling } from "./empty-billing";

interface Props {
  tenant: {
    id: string;
    slug: string;
    partitionLimitExceededAt: Date | null | undefined;
    paidStatus: string;
    metadata: any;
  };
  defaultPartitionLimit: number;
}

export default function BillingSettingsClient({ tenant, defaultPartitionLimit }: Props) {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<any>(null);
  const [mustProvisionBillingCustomer, setMustProvisionBillingCustomer] = useState<boolean>(false);
  const [partitionInfo, setPartitionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingUnavailable, setBillingUnavailable] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getBillingInfo(tenant.slug)
      .then((data) => {
        if (isMounted) {
          setBillingData(data.billingData);
          setMustProvisionBillingCustomer(data.mustProvisionBillingCustomer);
          setPartitionInfo(data.partitionInfo);
          setBillingUnavailable(Boolean(data.billingUnavailable));
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [tenant.slug]);

  if (loading) {
    return (
      <div className="w-full p-4 flex-grow flex flex-col relative">
        <div className="flex w-full justify-between items-center mb-8">
          <h1 className="font-bold text-[32px] text-[#343A40]">Billing</h1>
        </div>
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 flex-grow flex flex-col relative">
        <div className="flex w-full justify-between items-center mb-12">
          <h1 className="font-bold text-[32px] text-[#343A40]">Billing</h1>
        </div>
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (billingUnavailable) {
    return (
      <div className="w-full p-4 flex-grow flex flex-col relative">
        <div className="flex w-full justify-between items-center mb-8">
          <h1 className="font-bold text-[32px] text-[#343A40]">Billing</h1>
        </div>
        <WarningMessage>
          Billing isn&apos;t configured yet for this environment. Add an `ORB_API_KEY` (and related Orb credentials) to
          enable subscriptions, or hide the billing page until you&apos;re ready.
        </WarningMessage>
      </div>
    );
  }

  if (mustProvisionBillingCustomer || billingData?.currentPlan?.name === "developer") {
    return <EmptyBilling pricingPlansPath={getPricingPlansPath(tenant.slug)} />;
  }

  return (
    <BillingSettings
      tenant={tenant}
      partitionInfo={partitionInfo}
      defaultPartitionLimit={defaultPartitionLimit}
      billingData={billingData}
    />
  );
}
