export type ServiceTier = "basic" | "standard" | "deep";

export const SQFT_TIERS = [
  { id: "u1000", label: "Under 1,000 sq ft" },
  { id: "1000_1500", label: "1,000 – 1,500 sq ft" },
  { id: "1500_2000", label: "1,500 – 2,000 sq ft" },
  { id: "2000_2500", label: "2,000 – 2,500 sq ft" },
  { id: "2500_3000", label: "2,500 – 3,000 sq ft" },
  { id: "3000_4000", label: "3,000 – 4,000 sq ft" },
  { id: "4000p", label: "4,000+ sq ft" },
] as const;

export const ROOM_FIELDS = [
  { key: "bedrooms", label: "Bedrooms" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "kitchens", label: "Kitchens" },
  { key: "living_rooms", label: "Living rooms" },
  { key: "dining_rooms", label: "Dining rooms" },
  { key: "offices", label: "Offices" },
  { key: "finished_basement", label: "Finished basement" },
  { key: "laundry_room", label: "Laundry room" },
] as const;

export type RoomKey = (typeof ROOM_FIELDS)[number]["key"];

export interface PricingRules {
  min_job_price: number;
  tier_multipliers: Record<ServiceTier, number>;
  room_prices: Record<RoomKey, number>;
  sqft_tier_prices: Record<string, number>;
  discount_by_tier: Record<ServiceTier, number>;
}
