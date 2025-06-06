import { getCurrentPlan, TenantPlan } from "@/lib/billing/tenant";
import { getExistingMetadata } from "@/lib/server/billing";
import { getMembersByTenantId } from "@/lib/server/service";
import { BILLING_ENABLED } from "@/lib/server/settings";
import { adminOrRedirect } from "@/lib/server/utils";

import SettingsNav from "../settings-nav";

import UserSettings from "./user-settings";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SettingsUsersIndexPage({ params }: Props) {
  const p = await params;
  const { tenant } = await adminOrRedirect(p.slug);
  const { members, totalUsers, totalInvites } = await getMembersByTenantId(tenant.id, 1, 10);

  let currentPlanSeats: number | undefined = undefined;
  let currentPlan: TenantPlan | undefined = undefined;
  if (BILLING_ENABLED) {
    const existingMetadata = await getExistingMetadata(tenant.id);
    currentPlan = getCurrentPlan(existingMetadata);
    currentPlanSeats = currentPlan?.seats;
  }

  return (
    <div className="max-w-[1140px] w-full p-4 flex-grow flex">
      <SettingsNav tenant={tenant} billingEnabled={BILLING_ENABLED} />
      <UserSettings
        tenant={tenant}
        initialMembers={members}
        initialTotalUsers={totalUsers}
        initialTotalInvites={totalInvites}
        pageSize={10}
        currentPlanSeats={currentPlanSeats}
        currentPlan={currentPlan?.name}
      />
    </div>
  );
}
