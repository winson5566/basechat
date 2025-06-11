"use client";

import { Settings, Users } from "lucide-react";
import Link from "next/link";

import { BillingCard } from "./billing-information";

interface EmptyBillingProps {
  pricingPlansPath: string;
}

export function EmptyBilling({ pricingPlansPath }: EmptyBillingProps) {
  return (
    <div className="w-full p-4 flex-grow flex flex-col relative">
      <div className="flex w-full justify-between items-center mb-12">
        <h1 className="font-bold text-[32px] text-[#343A40]">Billing</h1>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <BillingCard
            title="No active data plan"
            description="Select a plan to get started"
            icon={<Settings className="h-5 w-5" />}
          >
            <Link
              href={pricingPlansPath}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto mt-4"
            >
              Upgrade Plan
            </Link>
          </BillingCard>

          <BillingCard
            title="Team Management"
            description="Manage your team members and seats"
            icon={<Users className="h-5 w-5" />}
          >
            <div className="mt-4">
              <div className="text-sm font-medium text-muted-foreground">Seats</div>
              <div className="mt-1 text-2xl font-semibold">0 / 0</div>
              <Link
                href={pricingPlansPath}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto mt-4"
              >
                Upgrade Plan
              </Link>
            </div>
          </BillingCard>
        </div>
      </div>
      <div className="h-16" />
      <div className="h-16" />
      <div className="h-16" />
    </div>
  );
}
