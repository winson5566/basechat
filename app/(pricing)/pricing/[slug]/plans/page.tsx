import { getMembersByTenantId } from "@/lib/server/service";
import { requireAdminContext } from "@/lib/server/utils";

import PlansPageContent from "./plans-page-client";

export default async function PricingPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await params;
  const { tenant } = await requireAdminContext(p.slug);

  const { totalUsers, totalInvites } = await getMembersByTenantId(tenant.id, 1, 10);
  const userCount = Number(totalUsers) + Number(totalInvites);

  return (
    <PlansPageContent
      tenant={{
        name: tenant.name,
        slug: tenant.slug,
        paidStatus: tenant.paidStatus,
        metadata: tenant.metadata ?? {},
      }}
      userCount={userCount}
    />
  );
}
