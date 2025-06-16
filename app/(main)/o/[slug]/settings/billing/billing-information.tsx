"use client";

import { format } from "date-fns";
import { History, ChevronRight, CreditCardIcon, UsersIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Orb from "orb-billing";
import React from "react";
import { toast } from "sonner";
import Stripe from "stripe";

import { ManageSeatsDialog } from "@/components/billing/manage-seats-dialog";
import PaymentMethod from "@/components/billing/payment-method";
import { Card } from "@/components/ui/card";
import { PLANS } from "@/lib/orb-types";

type BillingData = {
  hasBillingHistory: boolean;
  overdueInvoice: Orb.Invoices.Invoice | null;
  nextPaymentDate: string | null;
  defaultPaymentMethod: {
    id: string;
    card: Stripe.PaymentMethod.Card | null;
    billing_details: any;
    created: number;
    type: string;
  } | null;
  currentPlan: {
    id: string;
    name: string;
    endedAt: string | null;
    startedAt: string;
    tier: string;
    seats: number;
  };
  invoices: Orb.Invoices.Invoice[];
  subscriptions: any[]; // TODO: Add proper type
  userCount: number;
};

interface BillingInformationProps {
  billingData: BillingData;
  billingPath: string;
  pricingPlansPath: string;
  tenant: {
    id: string;
    slug: string;
  };
}

interface BillingCardProps {
  children: React.ReactNode;
}

function BillingMessage({
  overdueInvoice,
  nextPaymentDate,
}: {
  overdueInvoice: Orb.Invoices.Invoice | null;
  nextPaymentDate: string | null;
}) {
  if (overdueInvoice) {
    return <p className="text-sm text-destructive-foreground">Payment overdue</p>;
  }

  if (nextPaymentDate) {
    return <p className="text-sm text-muted-foreground">Next payment {format(nextPaymentDate, "LLL d, yyyy")}</p>;
  }

  return null;
}

export function BillingCard({ children }: BillingCardProps) {
  return (
    <Card className="border-none shadow-none bg-[#F5F5F7]">
      <div className="p-6">{children}</div>
    </Card>
  );
}

interface BillingCardLinkProps {
  href: string;
  children: React.ReactNode;
  isFirst?: boolean;
}

function BillingCardLink({ href, children, isFirst }: BillingCardLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between w-full py-3 ${!isFirst ? "border-t border-gray-200" : ""} text-base font-medium text-[#1D1D1F] hover:text-foreground transition-colors`}
    >
      <div className="flex items-center gap-3">{children}</div>
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

export function BillingInformation({ billingData, billingPath, pricingPlansPath, tenant }: BillingInformationProps) {
  const router = useRouter();
  const currentPlan = billingData.currentPlan;
  const planType = currentPlan.name as keyof typeof PLANS;
  const planConfig = PLANS[planType];
  const totalSeats = currentPlan.seats ?? 0;
  const usedSeats = billingData.userCount;

  const [manageSeatsOpen, setManageSeatsOpen] = React.useState(false);
  const handleSaveSeats = async (newSeats: number) => {
    try {
      const response = await fetch(`/api/billing/update-seats`, {
        method: "POST",
        body: JSON.stringify({ seats: newSeats }),
        headers: { tenant: tenant.slug },
      });

      if (!response.ok) {
        throw new Error("Failed to update seats");
      }

      toast.success("Successfully updated team seats");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.refresh();
    } catch (error) {
      toast.error("Failed to update team seats");
      console.error("Error updating seats:", error);
    }
  };

  if (!planConfig) {
    console.error("Plan configuration not found for plan:", currentPlan);
    return null;
  }

  return (
    <div className="space-y-8">
      <BillingMessage overdueInvoice={billingData.overdueInvoice} nextPaymentDate={billingData.nextPaymentDate} />

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4 mt-12">Data Plan</h3>
          <BillingCard>
            <div className="flex flex-col">
              <div>
                <div className="text-2xl font-semibold">{planConfig.displayName} plan</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {billingData.nextPaymentDate
                    ? `Next payment: ${format(billingData.nextPaymentDate, "LLL d, yyyy")}`
                    : null}
                </div>
              </div>
              <PaymentMethod hasControls defaultPaymentMethod={billingData.defaultPaymentMethod} tenant={tenant} />
              <BillingCardLink href={`${billingPath}/history`}>
                <History className="h-5 w-5 text-muted-foreground" />
                View payment history
              </BillingCardLink>
            </div>
          </BillingCard>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Seats</h3>
          <BillingCard>
            <div className="flex flex-col">
              <div>
                <div className="text-2xl font-semibold">
                  <span className={usedSeats > totalSeats ? "text-red-600" : undefined}>{totalSeats} total</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1 mb-3">{totalSeats - usedSeats} open seats</div>
              </div>
              <button
                type="button"
                className="flex items-center justify-between w-full py-3 border-t border-gray-200 text-base font-medium text-[#1D1D1F] hover:text-foreground transition-colors"
                onClick={() => setManageSeatsOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-5 w-5 text-muted-foreground" />
                  Manage seats
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </BillingCard>
          <ManageSeatsDialog
            open={manageSeatsOpen}
            onOpenChange={setManageSeatsOpen}
            currentSeats={totalSeats}
            onSave={handleSaveSeats}
            tenantId={tenant.id}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Account</h3>
          <BillingCard>
            <div className="flex flex-col">
              <BillingCardLink href={`${pricingPlansPath}`} isFirst>
                <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                Change plans
              </BillingCardLink>
              <BillingCardLink href={`${billingPath}/payment-method`}>
                <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                Manage payment method
              </BillingCardLink>
            </div>
          </BillingCard>
        </div>
      </div>
    </div>
  );
}
