import { requireAdminContext } from "@/lib/server/utils";

import PlansPageContent from "./plans-page-client";

export default async function PricingPage({ params }: { params: { slug: string } }) {
  const { tenant } = await requireAdminContext(params.slug);

  return (
    <PlansPageContent
      tenant={{
        name: tenant.name,
        slug: tenant.slug,
        paidStatus: tenant.paidStatus,
        metadata: tenant.metadata ?? {},
      }}
    />
  );
}
