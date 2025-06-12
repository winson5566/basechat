"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PLANS, PlanType } from "@/lib/orb-types";
import { getDataPath } from "@/lib/paths";

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
    <div className="flex items-center gap-2 h-full">
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
          <div className="text-lg font-semibold">Documents and Images</div>
        </th>
        <td colSpan={3} className="py-3" />
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6 text-muted-foreground">
          <div className="font-normal">Page Limit</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={true}
                text={isEnterprise ? "Custom" : `${plan?.partitionLimit.toLocaleString()} pages`}
              />
            </td>
          );
        })}
      </tr>

      {/* Audio and Video Section */}
      <tr>
        <th scope="row" className="py-3 font-normal leading-6 text-muted-foreground">
          <div className="text-lg font-semibold">Audio and Video</div>
        </th>
        <td colSpan={3} className="py-3" />
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6 text-muted-foreground">
          <div className="font-normal">Streaming</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={true}
                text={isEnterprise ? "Custom" : `${plan?.streamingLimit.toLocaleString()} GB`}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6 text-muted-foreground">
          <div className="font-normal">Audio Processing</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={true}
                text={isEnterprise ? "Custom" : `${plan?.audioLimit.toLocaleString()} minutes`}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <th scope="row" className="border-b py-3 font-normal leading-6 text-muted-foreground">
          <div className="font-normal">Video Processing</div>
        </th>
        {["starter", "pro", "enterprise"].map((tierId) => {
          const plan = PLANS[tierId as PlanType];
          const isEnterprise = tierId === "enterprise";
          return (
            <td key={tierId} className="border-b py-3">
              <TierFeatureContent
                check={true}
                text={isEnterprise ? "Custom" : `${plan?.videoLimit.toLocaleString()} minutes`}
              />
            </td>
          );
        })}
      </tr>
    </>
  );
}

export default function PlansPageContent({ tenant, userCount }: PlansPageContentProps) {
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
                        <h2 className="font-medium pb-0 text-2xl">{plan ? plan.displayName : "Enterprise"}</h2>
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
                        <div className="flex h-full flex-col gap-6">
                          <p className="text-xs">
                            {plan?.description || "Built for large teams with complex, high-volume data"}
                          </p>

                          {/* Action Button */}
                          <Button
                            className="w-full"
                            style={{
                              backgroundColor: isEnterprise ? "#E5E7EB" : "#D946EF",
                              color: isEnterprise ? "#000000" : "white",
                            }}
                            onClick={() => {
                              if (isEnterprise) {
                                window.open("https://calendly.com/d/crhj-b4f-d4v/ragie-basechat-discussion", "_blank");
                              } else {
                                router.push(`/pricing/${tenant.slug}/plan-change?plan-type=${tierId}`);
                              }
                            }}
                          >
                            {isEnterprise ? "Contact Sales" : "Get Started"}
                          </Button>

                          {/* Price Display */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-baseline gap-x-1 h-8">
                              {isEnterprise ? (
                                <span>Custom pricing</span>
                              ) : (
                                <>
                                  <span>${displayPrice} / month</span>
                                  {isYearlyBilling && isPro && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#D946EF] text-white">
                                      -10%
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Yearly Billing Switch for Pro Plan */}
                            {isPro && (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={isYearlyBilling}
                                  onCheckedChange={setIsYearlyBilling}
                                  className="data-[state=checked]:bg-[#D946EF]"
                                />
                                <span className="text-sm text-gray-600">Billed yearly</span>
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
      <div className="mt-8 text-left">
        <p className="text-sm text-gray-600">
          Have questions?{" "}
          <Link
            href="https://calendly.com/d/crhj-b4f-d4v/ragie-basechat-discussion"
            target="_blank"
            className="text-[#D946EF] hover:text-[#D946EF]/90 text-sm font-medium underline"
          >
            Schedule a call
          </Link>
        </p>
      </div>
    </div>
  );
}
