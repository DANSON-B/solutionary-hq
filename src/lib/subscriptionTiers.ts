export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    price: 49,
    price_id: "price_1TQwFyK3YeRrLGOffGEIdPpt",
    product_id: "prod_UPlnnvU1iPGcr8",
    features: [
      "1 User",
      "Estimates & Invoicing",
      "Online Booking Page",
      "Customer Management",
      "Mobile App Access",
      "Email Support",
    ],
  },
  professional: {
    name: "Professional",
    price: 99,
    price_id: "price_1TQwG0K3YeRrLGOfiNOnAAir",
    product_id: "prod_UPlnkZ66m0knbJ",
    popular: true,
    features: [
      "Up to 5 Users",
      "Everything in Starter",
      "Scheduling & Dispatch",
      "Route Optimization",
      "Online Payments",
      "Automated Reminders",
      "QuickBooks Integration",
      "Priority Support",
    ],
  },
  business: {
    name: "Business",
    price: 199,
    price_id: "price_1TQwG2K3YeRrLGOfScXSx7yA",
    product_id: "prod_UPlnJsUZfzFEQx",
    features: [
      "Unlimited Users",
      "Everything in Professional",
      "Customer Financing",
      "Advanced Reporting",
      "Custom Branding",
      "API Access",
      "Dedicated Account Manager",
      "Phone Support",
    ],
  },
} as const;

export type SubscriptionTierKey = keyof typeof SUBSCRIPTION_TIERS;

export function getTierByProductId(productId: string): SubscriptionTierKey | null {
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.product_id === productId) return key as SubscriptionTierKey;
  }
  return null;
}
