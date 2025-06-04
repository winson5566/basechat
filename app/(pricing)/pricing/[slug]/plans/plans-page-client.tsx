"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentPlan, TenantMetadata } from "@/lib/billing/tenant";
import { PLANS, PlanType, TIER_UPGRADE_PATH, TIER_COLORS, Tier } from "@/lib/orb-types";
import { getDataPath } from "@/lib/paths";
import { capitalizeFirstLetter } from "@/lib/utils";

interface PlansPageContentProps {
  tenant: {
    name: string;
    slug: string;
    paidStatus: string;
    metadata: {
      plans?: Array<{
        id: string;
        endedAt: Date | null;
        startedAt: Date;
        tier: string;
        seats: number;
      }>;
    };
  };
  userCount: number;
}

function TierFeatureContent({ check, text }: { check: boolean; text: React.ReactNode | string | undefined }) {
  return (
    <div className="flex items-center gap-2">
      {check && <Check aria-hidden="true" className="h-5 w-5 text-white" />}
      {text && <span>{text}</span>}
    </div>
  );
}

function FeatureItem() {
  return (
    <tr>
      <th scope="row" className="border-b py-3 font-normal leading-6 text-muted-foreground">
        Page Limit
      </th>
      {TIER_UPGRADE_PATH.map((tierId) => {
        const plan = PLANS[tierId as PlanType];
        const isEnterprise = tierId === "enterprise";
        return (
          <td key={tierId} className="border-b py-4">
            <TierFeatureContent
              check={true}
              text={isEnterprise ? "Unlimited pages" : `${plan?.partitionLimit.toLocaleString()} pages`}
            />
          </td>
        );
      })}
    </tr>
  );
}

export default function PlansPageContent({ tenant, userCount }: PlansPageContentProps) {
  const router = useRouter();
  // Get the current active plan
  const currentPlan = getCurrentPlan(tenant.metadata as TenantMetadata);
  // If no current plan, treat as developer plan
  const currentPlanType = currentPlan?.name || "developer";
  const effectivePlan = currentPlan || {
    name: "developer",
    seats: userCount,
    startedAt: new Date(),
    endedAt: null,
    tier: "developer",
    id: "developer-fallback",
  };

  // Determine if tenant is in trial
  const isInTrial = tenant.paidStatus === "trial" || tenant.paidStatus === "legacy";

  return (
    <div className="w-full max-w-[1200px] relative">
      <Link href={getDataPath(tenant.slug)} className="absolute top-0 left-0 text-sm text-gray-500 hover:text-gray-700">
        Cancel
      </Link>

      <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>

      {/* Current Plan Section */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
        {effectivePlan ? (
          <div className="space-y-2">
            <p className="text-gray-600">
              You are currently on the {capitalizeFirstLetter(currentPlanType)} plan with {effectivePlan.seats} seat
              {effectivePlan.seats !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-gray-500">Started on {new Date(effectivePlan.startedAt).toLocaleDateString()}</p>
          </div>
        ) : isInTrial ? (
          <div className="space-y-2">
            <p className="text-gray-600">You are currently on the Free Trial</p>
          </div>
        ) : (
          <p className="text-gray-600">
            {tenant.paidStatus === "expired" ? "Your trial has expired" : "You are on a paid plan"}
          </p>
        )}
      </div>

      {/* Pricing Table */}
      <div className="mx-auto mb-16 px-3">
        <div className="isolate block">
          <div className="relative -mx-8">
            <table className="w-full table-fixed border-separate border-spacing-x-8 text-left">
              <caption className="sr-only">Pricing plan comparison</caption>
              <colgroup>
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
                <col className="w-1/6" />
              </colgroup>
              <thead>
                <tr>
                  <td />
                  {TIER_UPGRADE_PATH.filter((tierId) => tierId === "developer" || currentPlanType !== "developer").map(
                    (tierId) => {
                      const plan = PLANS[tierId as PlanType];
                      return (
                        <th key={tierId} scope="col" className="pt-6 xl:pt-8">
                          <h2 className="font-medium pb-0 text-2xl" style={{ color: TIER_COLORS[tierId] }}>
                            {tierId === "developer" ? "Free Trial" : plan ? plan.displayName : "Enterprise"}
                          </h2>
                          <div className="h-0.5 mt-5" style={{ background: TIER_COLORS[tierId] }} />
                        </th>
                      );
                    },
                  )}
                </tr>
              </thead>

              <tbody className="w-full">
                <tr className="h-fit">
                  <th scope="row">
                    <span className="sr-only">Price</span>
                  </th>

                  {TIER_UPGRADE_PATH.filter((tierId) => tierId === "developer" || currentPlanType !== "developer").map(
                    (tierId) => {
                      const plan = PLANS[tierId as PlanType];
                      const isEnterprise = tierId === "enterprise";

                      return (
                        <td key={tierId} className="pt-2 align-top">
                          <div className="flex h-full flex-col gap-6">
                            <p className="text-xs">
                              {tierId === "developer"
                                ? "2-week free trial to explore Base Chat"
                                : PLANS[tierId as PlanType]?.description || "Custom enterprise solutions"}
                            </p>

                            {/* Price Display */}
                            <div className="flex items-baseline gap-x-1">
                              {isEnterprise ? (
                                <span className="text-xl">Custom pricing</span>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold">${plan.price}</span>
                                  <span className="text-muted-foreground">/ month</span>
                                </>
                              )}
                            </div>

                            {/* Action Button */}
                            <Button
                              className="w-full"
                              style={{
                                backgroundColor: currentPlanType === tierId ? "#9CA3AF" : TIER_COLORS[tierId],
                                color: "white",
                              }}
                              disabled={
                                currentPlanType === tierId ||
                                (tierId === "developer" && currentPlanType !== "developer")
                              }
                              onClick={() => {
                                if (isEnterprise) {
                                  window.location.href = "mailto:support@ragie.ai?subject=Enterprise%20Plan%20Inquiry";
                                } else {
                                  router.push(`/pricing/${tenant.slug}/plan-change?plan-type=${tierId}`);
                                }
                              }}
                            >
                              {currentPlanType === tierId
                                ? "Current Plan"
                                : isEnterprise
                                  ? "Contact Sales"
                                  : TIER_UPGRADE_PATH.indexOf(tierId) <
                                      TIER_UPGRADE_PATH.indexOf(currentPlanType as Tier)
                                    ? "Downgrade"
                                    : "Upgrade"}
                            </Button>
                          </div>
                        </td>
                      );
                    },
                  )}
                </tr>

                <tr>
                  <td colSpan={5} className="pt-8">
                    <hr className="w-full" />
                  </td>
                </tr>

                {/* Feature Sections */}
                <FeatureItem />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="mt-8 text-left">
        <p className="text-sm text-gray-600">
          Have questions?{" "}
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Contact us
          </Link>
          {/* TODO: add calendly link */}
        </p>
      </div>
    </div>
  );
}
