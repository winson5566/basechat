"use client";

import WarningMessage from "@/components/warning-message";

type PartitionInfo = {
  name: string;
  isDefault: boolean;
  limitExceededAt: Date | null;
  limits: {
    pagesProcessedLimitMonthly: number | null;
    pagesHostedLimitMonthly: number | null;
    pagesProcessedLimitMax: number | null;
    pagesHostedLimitMax: number | null;
  };
  stats: {
    pagesProcessedMonthly: number;
    pagesHostedMonthly: number;
    pagesProcessedTotal: number;
    pagesHostedTotal: number;
    documentCount: number;
  };
};

type Props = {
  tenant: {
    partitionLimitExceededAt: Date | null;
  };
  partitionInfo: PartitionInfo;
  defaultPartitionLimit: number;
};

export default function BillingSettings({ tenant, partitionInfo, defaultPartitionLimit }: Props) {
  return (
    <div className="w-full p-4 flex-grow flex flex-col relative">
      <div className="flex w-full justify-between items-center mb-8">
        <h1 className="font-bold text-[32px] text-[#343A40]">Billing</h1>
      </div>

      {!isNaN(defaultPartitionLimit) && tenant.partitionLimitExceededAt && (
        <WarningMessage className="mb-4">
          You have reached the page processing limit for this chatbot. Please contact support@ragie.ai if you need
          assistance.
        </WarningMessage>
      )}

      <div className="space-y-8">
        <div className="bg-white rounded-lg border border-[#D7D7D7] p-6">
          <h2 className="font-semibold text-xl text-[#343A40] mb-4">Processing Information</h2>
          <div className="space-y-6">
            <hr className="border-[#D7D7D7]" />
            <div>
              <h3 className="font-medium text-base text-[#343A40] mb-2">Limits</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-[#74747A]">Max Pages Processed Limit:</span>{" "}
                  {partitionInfo.limits.pagesProcessedLimitMax ?? "Unlimited"}
                </p>
                <p className="text-sm">
                  <span className="text-[#74747A]">Limit Exceeded At:</span>{" "}
                  {partitionInfo.limitExceededAt ? partitionInfo.limitExceededAt.toLocaleString() : "Never"}
                </p>
              </div>
            </div>

            <hr className="border-[#D7D7D7]" />

            <div>
              <h3 className="font-medium text-base text-[#343A40] mb-2">Statistics</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-[#74747A]">Monthly Pages Processed:</span>{" "}
                  {partitionInfo.stats.pagesProcessedMonthly.toFixed(2)}
                </p>
                <p className="text-sm">
                  <span className="text-[#74747A]">Monthly Pages Hosted:</span>{" "}
                  {partitionInfo.stats.pagesHostedMonthly.toFixed(2)}
                </p>
                <p className="text-sm">
                  <span className="text-[#74747A]">Total Pages Processed:</span>{" "}
                  {partitionInfo.stats.pagesProcessedTotal.toFixed(2)}
                </p>
                <p className="text-sm">
                  <span className="text-[#74747A]">Total Pages Hosted:</span>{" "}
                  {partitionInfo.stats.pagesHostedTotal.toFixed(2)}
                </p>
                <p className="text-sm">
                  <span className="text-[#74747A]">Total Documents:</span> {partitionInfo.stats.documentCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-16" />
      <div className="h-16" />
      <div className="h-16" />
      <div className="h-16" />
    </div>
  );
}
