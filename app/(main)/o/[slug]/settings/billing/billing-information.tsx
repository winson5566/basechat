"use client";

import { format } from "date-fns";
import { CreditCard, History, Users, Settings, ChevronRight } from "lucide-react";
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
  stripeCustomerId?: string;
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
  title: string;
  description?: string;
  icon: React.ReactNode;
  color?: string;
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

function BillingCard({ title, description, icon, color, children }: BillingCardProps) {
  return (
    <Card
      className={`border-t-4 ${color ? "" : "border-t-gray-200"}`}
      style={color ? { borderColor: color } : undefined}
    >
      <div className="p-6">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </Card>
  );
}

interface BillingCardLinkProps {
  href: string;
  children: React.ReactNode;
}

function BillingCardLink({ href, children }: BillingCardLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto mt-4"
    >
      {children}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

export function BillingInformation({ billingData, billingPath, pricingPlansPath, tenant }: BillingInformationProps) {
  const router = useRouter();
  const currentPlan = billingData.currentPlan;
  // Map the plan name to the corresponding plan type in PLANS
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
    <div className="space-y-6">
      <BillingMessage overdueInvoice={billingData.overdueInvoice} nextPaymentDate={billingData.nextPaymentDate} />

      <div className="space-y-6">
        <BillingCard
          title={`${planConfig.displayName === "Developer" ? "Free Trial" : `${planConfig.displayName} Plan`}`}
          description={planConfig.description}
          icon={<Settings className="h-5 w-5" />}
          color={planConfig.color}
        >
          <BillingCardLink href={`${pricingPlansPath}`}>Manage Plan</BillingCardLink>
        </BillingCard>

        <BillingCard
          title="Team Management"
          description="Manage your team members and seats"
          icon={<Users className="h-5 w-5" />}
        >
          <div className="mt-4">
            <div className="text-sm font-medium text-muted-foreground">Seats</div>
            <div className="mt-1 text-2xl font-semibold">
              <span className={usedSeats > totalSeats ? "text-red-600" : undefined}>
                {usedSeats} / {totalSeats}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
            onClick={() => setManageSeatsOpen(true)}
          >
            Manage Team
            <ChevronRight className="h-4 w-4" />
          </button>
          <ManageSeatsDialog
            open={manageSeatsOpen}
            onOpenChange={setManageSeatsOpen}
            currentSeats={totalSeats}
            onSave={handleSaveSeats}
            tenantId={tenant.id}
          />
        </BillingCard>

        <BillingCard
          title="Payment History"
          description="View your billing history and invoices"
          icon={<History className="h-5 w-5" />}
        >
          <div className="mt-4">
            <div className="text-sm font-medium text-muted-foreground">Recent Activity</div>
            <div className="mt-1 text-2xl font-semibold">
              {billingData.invoices.length} Invoice{billingData.invoices.length !== 1 ? "s" : ""}
            </div>
          </div>
          <BillingCardLink href={`${billingPath}/history`}>View Payment History</BillingCardLink>
        </BillingCard>

        <BillingCard title="Account Management" icon={<CreditCard className="h-5 w-5" />}>
          <div className="mt-4">
            {billingData.stripeCustomerId && (
              <PaymentMethod hasControls defaultPaymentMethod={billingData.defaultPaymentMethod} tenant={tenant} />
            )}
          </div>
          <BillingCardLink href={`${billingPath}/payment-method`}>Manage Payment Methods</BillingCardLink>
        </BillingCard>
      </div>
    </div>
  );
}
