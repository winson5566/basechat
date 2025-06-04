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

export interface Feature {
  name: string;
  tiersCheck: Record<string, boolean>;
  tiersText: Record<string, string | undefined>;
  subFeatures?: Feature[];
  custom?: React.ReactNode;
}

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
  features?: Feature[];
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
    features: [
      {
        name: "Core Features",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "Basic chat functionality",
          [Tier.STARTER]: "Basic chat functionality",
          [Tier.PRO]: "Advanced chat functionality",
          [Tier.ENTERPRISE]: "Custom chat functionality",
        },
      },
      {
        name: "Partition Limit",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "10,000 partitions",
          [Tier.STARTER]: "50,000 partitions",
          [Tier.PRO]: "100,000 partitions",
          [Tier.ENTERPRISE]: "Unlimited partitions",
        },
      },
      {
        name: "Support",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "Community support",
          [Tier.STARTER]: "Email support",
          [Tier.PRO]: "Priority email support",
          [Tier.ENTERPRISE]: "Dedicated support team",
        },
      },
    ],
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
    features: [
      {
        name: "Core Features",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "Basic chat functionality",
          [Tier.STARTER]: "Basic chat functionality",
          [Tier.PRO]: "Advanced chat functionality",
          [Tier.ENTERPRISE]: "Custom chat functionality",
        },
      },
      {
        name: "Partition Limit",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "10,000 partitions",
          [Tier.STARTER]: "50,000 partitions",
          [Tier.PRO]: "100,000 partitions",
          [Tier.ENTERPRISE]: "Unlimited partitions",
        },
      },
      {
        name: "Support",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "Community support",
          [Tier.STARTER]: "Email support",
          [Tier.PRO]: "Priority email support",
          [Tier.ENTERPRISE]: "Dedicated support team",
        },
      },
    ],
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
    features: [
      {
        name: "Core Features",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "Basic chat functionality",
          [Tier.STARTER]: "Basic chat functionality",
          [Tier.PRO]: "Advanced chat functionality",
          [Tier.ENTERPRISE]: "Custom chat functionality",
        },
      },
      {
        name: "Partition Limit",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "10,000 partitions",
          [Tier.STARTER]: "50,000 partitions",
          [Tier.PRO]: "100,000 partitions",
          [Tier.ENTERPRISE]: "Unlimited partitions",
        },
      },
      {
        name: "Support",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "Community support",
          [Tier.STARTER]: "Email support",
          [Tier.PRO]: "Priority email support",
          [Tier.ENTERPRISE]: "Dedicated support team",
        },
      },
    ],
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
    features: [
      {
        name: "Core Features",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "Basic chat functionality",
          [Tier.STARTER]: "Basic chat functionality",
          [Tier.PRO]: "Advanced chat functionality",
          [Tier.ENTERPRISE]: "Custom chat functionality",
        },
      },
      {
        name: "Partition Limit",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "10,000 partitions",
          [Tier.STARTER]: "50,000 partitions",
          [Tier.PRO]: "100,000 partitions",
          [Tier.ENTERPRISE]: "Unlimited partitions",
        },
      },
      {
        name: "Support",
        tiersCheck: {
          [Tier.DEVELOPER]: true,
          [Tier.STARTER]: true,
          [Tier.PRO]: true,
          [Tier.ENTERPRISE]: true,
        },
        tiersText: {
          [Tier.DEVELOPER]: "Community support",
          [Tier.STARTER]: "Email support",
          [Tier.PRO]: "Priority email support",
          [Tier.ENTERPRISE]: "Dedicated support team",
        },
      },
    ],
  },
];
