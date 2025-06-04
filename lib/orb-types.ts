import Orb from "orb-billing";
import { z } from "zod";

export const ACTIVE_SUBSCRIPTION_STATUS: String[] = ["active", "upcoming"];

export const tierSchema = z.union([
  z.literal("developer"),
  z.literal("starter"),
  z.literal("pro"),
  z.literal("enterprise"),
]);

export type Tier = z.infer<typeof tierSchema>;

export const planTypeSchema = z.union([z.literal("developer"), z.literal("starter"), z.literal("pro")]);

export type PlanType = z.infer<typeof planTypeSchema>;

export const billingCycleSchema = z.union([z.literal("monthly"), z.literal("annual")]);

export type BillingCycle = z.infer<typeof billingCycleSchema>;

export type PlanDef = {
  planType: PlanType;
  billingCycle: BillingCycle;
  tier: Tier;
  price: number;
  displayName: string;
  alternateCycleType?: PlanType;
  description: string;
  color: string;
  partitionLimit: number;
  mostPopular: boolean;
  buttonText: string;
  buttonLink: string | null;
  buttonHidden: boolean;
  hasCustomPricing?: boolean;
};

export const TIER_COLORS = {
  developer: "#D946EF",
  starter: "#38BDF8",
  pro: "#84CC16",
  enterprise: "#A1A1AA",
} as const;

export const PLANS: Record<PlanType, PlanDef> = {
  developer: {
    planType: "developer",
    billingCycle: "monthly",
    tier: "developer",
    price: 0,
    displayName: "Developer",
    description: "For personal projects or exploring Base Chat",
    color: TIER_COLORS.developer,
    partitionLimit: 10000,
    mostPopular: false,
    buttonText: "Get Started",
    buttonLink: null,
    buttonHidden: false,
  },
  starter: {
    planType: "starter",
    billingCycle: "monthly",
    tier: "starter",
    price: 100,
    displayName: "Starter",
    description: "Perfect for smaller teams and projects",
    color: TIER_COLORS.starter,
    partitionLimit: 10000,
    mostPopular: false,
    buttonText: "Upgrade",
    buttonLink: null,
    buttonHidden: false,
  },
  pro: {
    planType: "pro",
    billingCycle: "monthly",
    tier: "pro",
    price: 500,
    displayName: "Pro",
    description: "Production ready for growing businesses",
    color: TIER_COLORS.pro,
    partitionLimit: 60000,
    mostPopular: true,
    buttonText: "Upgrade",
    buttonLink: null,
    buttonHidden: false,
  },
};

export const TIER_UPGRADE_PATH = ["developer", "starter", "pro", "enterprise"] as const;

export const SEAT_ADD_ON_NAME = "Seat license";
export const SEAT_COST = 18;

export enum InternalTier {
  DEVELOPER_FREE = "developer-free", // Default free plan, new customers get this
  DEVELOPER = "developer",
  STARTER = "starter",
  PRO = "pro",
  PRO_FREE = "pro-dev", // Free plan
  ENTERPRISE = "enterprise",
}

export const INTERNAL_TIERS = [
  InternalTier.DEVELOPER_FREE.valueOf(),
  InternalTier.DEVELOPER.valueOf(),
  InternalTier.PRO.valueOf(),
  InternalTier.STARTER.valueOf(),
  InternalTier.PRO_FREE.valueOf(),
  InternalTier.ENTERPRISE.valueOf(),
];

export const TIERS = [
  InternalTier.DEVELOPER.valueOf(),
  InternalTier.STARTER.valueOf(),
  InternalTier.PRO.valueOf(),
  InternalTier.ENTERPRISE.valueOf(),
];

export type SubscriptionStatus = "active" | "trial" | "upcoming";

export function isTier(value: string): value is Tier {
  return TIERS.includes(value);
}

export function isInternalTier(value: string): value is InternalTier {
  return INTERNAL_TIERS.includes(value);
}

export function internalTierToPublic(tier: InternalTier): Tier {
  switch (tier) {
    case InternalTier.DEVELOPER:
      return InternalTier.DEVELOPER;
    case InternalTier.DEVELOPER_FREE:
      return InternalTier.DEVELOPER;
    // TODO update once changed
    case InternalTier.STARTER:
      return InternalTier.STARTER;
    case InternalTier.ENTERPRISE:
      return InternalTier.ENTERPRISE;
    case InternalTier.PRO:
      return InternalTier.PRO;
    case InternalTier.PRO_FREE:
      return InternalTier.PRO;
  }
}

// export type BillingCycle =
//     | "monthly"
//     | "one_time"
//     | "quarterly"
//     | "annual"
//     | "custom"
//     | "semi_annual";
export type SubscriptionCancelOption = "end_of_subscription_term" | "immediate" | "requested_date";

export type SeatChangePreview = {
  immediateInvoice: Orb.Invoices.Invoice | null;
  upcomingInvoice: Orb.Invoices.Invoice | null;
  currentSeatCharge: number;
  immediateSeatCharge: number;
  upcomingSeatCharge: number;
  daysLeftInCurrentBillingCycle: number;
  isFreeSeatsTier: boolean;
  hasFreeSeats: boolean;
  isSalesAssisted: boolean;
  allowedSeatCount: number;
  availableSeatCount: number;
};
