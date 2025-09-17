import { notFound } from "next/navigation";

import StepDetails from "./step-details";

// Example details page for the drawer
export default async function DetailsPage({
  params,
}: {
  params: Promise<{ slug: string; runId: string; stepIndex: string }>;
}) {
  const { runId, stepIndex } = await params;

  return <StepDetails runId={runId} stepIndex={stepIndex} />;
}
