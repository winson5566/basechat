export enum Tier {
  DEVELOPER = "developer",
  STARTER = "starter",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export const TIER_COLORS = {
  [Tier.DEVELOPER]: "#38BDF8",
  [Tier.STARTER]: "#84CC16",
  [Tier.PRO]: "#D946EF",
  [Tier.ENTERPRISE]: "#A1A1AA",
};

export interface PricingTier {
  name: string;
  id: Tier;
  priceMonthly: number | null;
  priceYearly: number | null;
  description: string;
  buttonText: string;
  buttonLink: string | null;
  buttonHidden: boolean;
  mostPopular: boolean;
  color: string;
  hasCustomPricing?: boolean;
  partitionLimit: number;
}

export const PRICING_TIER_CONFIG: PricingTier[] = [
  {
    name: "Developer",
    id: Tier.DEVELOPER,
    priceMonthly: 0,
    priceYearly: 0,
    description: "For personal projects or exploring Base Chat",
    buttonText: "Get Started",
    buttonLink: null,
    buttonHidden: false,
    mostPopular: false,
    color: TIER_COLORS[Tier.DEVELOPER],
    partitionLimit: 10000,
  },
  {
    name: "Starter",
    id: Tier.STARTER,
    priceMonthly: 18,
    priceYearly: 16,
    description: "Perfect for smaller teams and projects",
    buttonText: "Upgrade",
    buttonLink: null,
    buttonHidden: false,
    mostPopular: false,
    color: TIER_COLORS[Tier.STARTER],
    partitionLimit: 50000,
  },
  {
    name: "Pro",
    id: Tier.PRO,
    priceMonthly: 36,
    priceYearly: 32,
    description: "Production ready for growing businesses",
    buttonText: "Upgrade",
    buttonLink: null,
    mostPopular: true,
    buttonHidden: false,
    color: TIER_COLORS[Tier.PRO],
    partitionLimit: 100000,
  },
  {
    name: "Enterprise",
    id: Tier.ENTERPRISE,
    priceMonthly: null,
    priceYearly: null,
    description: "Dedicated support and custom solutions",
    buttonText: "Contact Sales",
    buttonLink: "mailto:support@ragie.ai?subject=Enterprise%20Plan%20Inquiry",
    buttonHidden: false,
    mostPopular: false,
    color: TIER_COLORS[Tier.ENTERPRISE],
    hasCustomPricing: true,
    partitionLimit: 100000,
  },
];
