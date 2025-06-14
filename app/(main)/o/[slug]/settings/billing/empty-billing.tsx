"use client";

import { Settings, Users, ChevronRight } from "lucide-react";
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
        <div>
          <h3 className="text-lg font-medium mb-4">Data Plan</h3>
          <BillingCard>
            <div className="flex flex-col">
              <div>
                <div className="text-2xl font-semibold">No active plan</div>
                <div className="text-sm text-muted-foreground mt-1">Select a plan to get started</div>
              </div>
              <Link
                href={pricingPlansPath}
                className="flex items-center justify-between w-full py-3 border-t border-gray-200 text-base font-medium text-[#1D1D1F] hover:text-foreground transition-colors mt-4"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Select a plan
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </BillingCard>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Seats</h3>
          <BillingCard>
            <div className="flex flex-col">
              <div>
                <div className="text-2xl font-semibold">0 total</div>
                <div className="text-sm text-muted-foreground mt-1 mb-3">0 open seats</div>
              </div>
              <Link
                href={pricingPlansPath}
                className="flex items-center justify-between w-full py-3 border-t border-gray-200 text-base font-medium text-[#1D1D1F] hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Upgrade to add seats
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </BillingCard>
        </div>
      </div>
    </div>
  );
}
