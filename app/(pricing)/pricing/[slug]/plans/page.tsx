import { getCurrentPlan } from "@/lib/billing/tenant";
import { requireAdminContext } from "@/lib/server/utils";

import PlansPageContent from "./plans-page-client";

export default async function PricingPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const { tenant } = await requireAdminContext(p.slug);
  const currentPlan = await getCurrentPlan(tenant.metadata || {});

  return (
    <PlansPageContent
      tenant={{
        name: tenant.name,
        slug: tenant.slug,
      }}
      currentPlanName={currentPlan?.name}
    />
  );
}
