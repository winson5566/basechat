"use client";

import { Card } from "@/components/ui/card";

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

interface ProcessingInformationProps {
  partitionInfo: PartitionInfo;
}

export default function ProcessingInformation({ partitionInfo }: ProcessingInformationProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Processing Information</h3>
      <Card className="border-none shadow-none bg-[#F5F5F7]">
        <div className="p-6">
          <div className="flex flex-col h-full">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-lg text-[#343A40] mb-2">Limits</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-[#1D1D1F]">Max Pages Processed Limit:</span>{" "}
                    {partitionInfo.limits.pagesProcessedLimitMax ?? "Unlimited"}
                  </p>
                  <p className="text-sm">
                    <span className="text-[#1D1D1F]">Limit Exceeded On:</span>{" "}
                    {partitionInfo.limitExceededAt ? partitionInfo.limitExceededAt.toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              <hr className="border-[#D7D7D7]" />

              <div>
                <h3 className="font-medium text-lg text-[#343A40] mb-2">Statistics</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-[#1D1D1F]">Monthly Pages Processed:</span>{" "}
                    {partitionInfo.stats.pagesProcessedMonthly.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="text-[#1D1D1F]">Monthly Pages Hosted:</span>{" "}
                    {partitionInfo.stats.pagesHostedMonthly.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="text-[#1D1D1F]">Total Pages Processed:</span>{" "}
                    {partitionInfo.stats.pagesProcessedTotal.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="text-[#1D1D1F]">Total Pages Hosted:</span>{" "}
                    {partitionInfo.stats.pagesHostedTotal.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <span className="text-[#1D1D1F]">Total Documents:</span> {partitionInfo.stats.documentCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
