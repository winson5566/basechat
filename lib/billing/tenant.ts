export type TenantPlan = {
  id: string; // orb subscription id
  name: string; // orb plan type "developer" "starter" "pro" "proAnnual" "proSeatsOnly"
  endedAt: Date | null;
  startedAt: Date;
  tier: string; // orb plan id
  seats: number;
};

export type TenantMetadata = {
  orbSubscriptionId?: string;
  orbCustomerId?: string;
  stripeCustomerId?: string;
  plans?: TenantPlan[];
};

export function getCurrentPlan(metadata: TenantMetadata): TenantPlan | undefined {
  return metadata.plans?.find((plan) => !plan.endedAt);
}
