"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PLANS, PlanType, TIER_UPGRADE_PATH, Tier } from "@/lib/orb-types";
import { getDataPath } from "@/lib/paths";

// Helper function to normalize pro and proAnnual
function normalizePlanName(planName: string | undefined): string | undefined {
  if (!planName) return undefined;
  return planName === "proAnnual" ? "pro" : planName;
}

interface PlansPageContentProps {
  tenant: {
    name: string;
    slug: string;
  };
  currentPlanName: string | undefined; // "developer" "starter" "pro" "proAnnual"
}

function TierFeatureContent({ check, text }: { check: boolean; text: React.ReactNode | string | undefined }) {
  return (
    <div className="flex items-center gap-2 h-full text-base font-medium">
      {check && <Check aria-hidden="true" className="h-5 w-5 text-white" />}
      {text && <span className="mt-0">{text}</span>}
    </div>
  );
}

function FeatureItem() {
  return (
    <>
      {/* Documents and Images Section */}
      <tr>
        <th scope="row" className="py-3 font-normal leading-6 text-muted-foreground">
          <div className="text-lg font-medium">Documents and Images</div>
        </th>
        <td colSpan={3} className="py-3" />
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6">
          <div className="text-base font-medium">Page processing</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={false}
                text={isEnterprise ? "Custom" : `${plan?.partitionLimit.toLocaleString()} pages`}
              />
            </td>
          );
        })}
      </tr>

      {/* Audio and Video Section */}
      <tr>
        <th scope="row" className="py-3 font-normal leading-6 text-muted-foreground">
          <div className="text-lg font-medium">Audio and Video</div>
        </th>
        <td colSpan={3} className="py-3" />
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6">
          <div className="text-base font-medium">Streaming</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={false}
                text={
                  isEnterprise
                    ? "Custom"
                    : plan?.streamingLimit > 1
                      ? `${plan?.streamingLimit.toLocaleString()} GB`
                      : `${plan?.streamingLimit.toLocaleString()} TB`
                }
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6">
          <div className="text-base font-medium">Audio processing</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={false}
                text={isEnterprise ? "Custom" : `${plan?.audioLimit.toLocaleString()} hours`}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6">
          <div className="text-base font-medium">Video processing</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={false}
                text={isEnterprise ? "Custom" : `${plan?.videoLimit.toLocaleString()} hours`}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6">
          <div className="text-base font-medium">Hosting</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={false}
                text={isEnterprise ? "Custom" : `${plan?.hostingLimit.toLocaleString()} GB`}
              />
            </td>
          );
        })}
      </tr>
    </>
  );
}

export default function PlansPageContent({ tenant, currentPlanName }: PlansPageContentProps) {
  const router = useRouter();
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);

  return (
    <div className="w-full max-w-[1200px] relative">
      <div className="flex flex-col gap-4">
        <Link href={getDataPath(tenant.slug)} className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </Link>
        <h1 className="text-3xl font-bold">Base Chat Data Plans</h1>
      </div>

      {/* Pricing Table */}
      <div className="mx-auto mb-16 px-3">
        <div className="isolate block">
          <div className="relative -mx-8">
            <table className="w-full table-fixed border-separate border-spacing-x-8 text-left">
              <caption className="sr-only">Pricing plan comparison</caption>
              <colgroup>
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
                <col className="w-1/4" />
              </colgroup>
              <thead>
                <tr>
                  <td />
                  {["starter", "pro", "enterprise"].map((tierId) => {
                    const plan = PLANS[tierId as PlanType];
                    return (
                      <th key={tierId} scope="col" className="pt-6 xl:pt-8">
                        <h2 className="font-bold pb-0 text-2xl">{plan ? plan.displayName : "Enterprise"}</h2>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="w-full">
                <tr className="h-fit">
                  <th scope="row">
                    <span className="sr-only">Price</span>
                  </th>

                  {["starter", "pro", "enterprise"].map((tierId) => {
                    const plan = PLANS[tierId as PlanType];
                    const isEnterprise = tierId === "enterprise";
                    const isPro = tierId === "pro";
                    const displayPrice = isPro && isYearlyBilling && plan ? plan.price * 0.9 : plan?.price;

                    return (
                      <td key={tierId} className="pt-2 align-top">
                        <div className="flex h-full flex-col gap-4">
                          <p className="text-base leading-snug font-medium">
                            {plan?.description || "Built for organization-wide deployment"}
                          </p>

                          {/* Action Button */}
                          <Button
                            className="w-full"
                            style={{
                              backgroundColor: isEnterprise
                                ? "#E5E7EB"
                                : normalizePlanName(currentPlanName) === tierId
                                  ? "white"
                                  : "#D946EF",
                              color: isEnterprise
                                ? "#000000"
                                : normalizePlanName(currentPlanName) === tierId
                                  ? "#000000"
                                  : "white",
                              border: normalizePlanName(currentPlanName) === tierId ? "1px solid #74747A" : "none",
                            }}
                            disabled={Boolean(
                              normalizePlanName(currentPlanName) === tierId ||
                                (currentPlanName &&
                                  TIER_UPGRADE_PATH.indexOf(normalizePlanName(currentPlanName) as Tier) >
                                    TIER_UPGRADE_PATH.indexOf(tierId as Tier)),
                            )}
                            onClick={() => {
                              if (isEnterprise) {
                                window.open("https://calendly.com/d/crhj-b4f-d4v/ragie-basechat-discussion", "_blank");
                              } else {
                                const planType = tierId === "pro" && isYearlyBilling ? "proAnnual" : tierId;
                                router.push(`/pricing/${tenant.slug}/plan-change?plan-type=${planType}`);
                              }
                            }}
                          >
                            {isEnterprise
                              ? "Contact Us"
                              : normalizePlanName(currentPlanName) === tierId
                                ? "Current Plan"
                                : currentPlanName &&
                                    TIER_UPGRADE_PATH.indexOf(normalizePlanName(currentPlanName) as Tier) >
                                      TIER_UPGRADE_PATH.indexOf(tierId as Tier)
                                  ? "Downgrade"
                                  : "Upgrade"}
                          </Button>

                          {/* Price Display */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-x-2 h-8 text-base font-medium">
                              {isEnterprise ? (
                                <span>Custom pricing</span>
                              ) : (
                                <>
                                  <span>${displayPrice} / month</span>
                                  {isYearlyBilling && isPro && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#D946EF] text-white">
                                      -10%
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {isPro && (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={isYearlyBilling}
                                  onCheckedChange={setIsYearlyBilling}
                                  className="data-[state=checked]:bg-[#D946EF]"
                                />
                                <span className="text-[15px] text-[#1D1D1F]">Billed yearly</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td colSpan={4} className="pt-8">
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
      <div className="mt-8 text-left text-base font-medium">
        <p className="text-[#1D1D1F]">
          Have questions?{" "}
          <Link
            href="https://calendly.com/d/crhj-b4f-d4v/ragie-basechat-discussion"
            target="_blank"
            className="text-[#D946EF] hover:text-[#D946EF]/90 underline"
          >
            Schedule a call
          </Link>
        </p>
      </div>
    </div>
  );
}
