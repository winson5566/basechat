import Orb from "orb-billing";
import { z } from "zod";

export const tierSchema = z.union([
  z.literal("developer"),
  z.literal("starter"),
  z.literal("pro"),
  z.literal("proAnnual"),
  z.literal("enterprise"),
]);

export type Tier = z.infer<typeof tierSchema>;

export const planTypeSchema = z.union([
  z.literal("developer"),
  z.literal("starter"),
  z.literal("pro"),
  z.literal("proAnnual"),
]);

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
  partitionLimit: number;
  hasCustomPricing?: boolean;
  streamingLimit: number;
  audioLimit: number;
  videoLimit: number;
  hostingLimit: number;
};

export const PLANS: Record<PlanType, PlanDef> = {
  developer: {
    planType: "developer",
    billingCycle: "monthly",
    tier: "developer",
    price: 0,
    displayName: "Free Trial",
    description: "2-week free trial to explore Base Chat",
    partitionLimit: 10000,
    streamingLimit: 200,
    audioLimit: 20,
    videoLimit: 20,
    hostingLimit: 20, // 20 GB
  },
  starter: {
    planType: "starter",
    billingCycle: "monthly",
    tier: "starter",
    price: 100,
    displayName: "Starter",
    description: "Perfect for smaller teams and knowledge bases",
    partitionLimit: 10000,
    streamingLimit: 200, // 200 GB
    audioLimit: 20,
    videoLimit: 20,
    hostingLimit: 20, // 20 GB
  },
  pro: {
    planType: "pro",
    billingCycle: "monthly",
    tier: "pro",
    price: 500,
    displayName: "Pro",
    description: "Designed for growing teams and content",
    partitionLimit: 60000,
    streamingLimit: 1, // 1 TB
    audioLimit: 100,
    videoLimit: 100,
    hostingLimit: 100, // 100 GB
    alternateCycleType: "proAnnual",
  },
  proAnnual: {
    planType: "proAnnual",
    billingCycle: "annual",
    tier: "proAnnual",
    price: 5400,
    displayName: "Pro",
    description: "Designed for growing teams and content",
    partitionLimit: 60000,
    streamingLimit: 1, // 1 TB
    audioLimit: 100,
    videoLimit: 100,
    hostingLimit: 100, // 100 GB
    alternateCycleType: "pro",
  },
};

export const TIER_UPGRADE_PATH = ["developer", "starter", "pro", "proAnnual", "enterprise"] as const;

export const SEAT_ADD_ON_NAME = "Seat license";
export const SEAT_COST = 18;

export type SeatChangePreview = {
  immediateInvoice: Orb.Invoices.Invoice | null;
  upcomingInvoice: Orb.Invoices.Invoice | null;
  currentSeatCharge: number;
  immediateSeatCharge: number;
  upcomingSeatCharge: number;
  daysLeftInCurrentBillingCycle: number;
  allowedSeatCount: number;
  availableSeatCount: number;
};
