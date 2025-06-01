export type TenantPlan = {
  id: string;
  endedAt: Date | null;
  startedAt: Date;
  tier: string;
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
