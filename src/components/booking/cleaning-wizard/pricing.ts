import type { WizardConfig, ServiceType, Frequency, Condition, SelectedAddOn } from "./types";

export interface PriceInput {
  serviceType: ServiceType;
  frequency: Frequency;
  condition: Condition;
  sqft: number;
  bedrooms: number; // residential only; 0 for commercial
  bathrooms: number;
  addOns: SelectedAddOn[];
}

export interface PriceResult {
  base: number;
  conditioned: number;
  bedroomCharge: number;
  bathroomCharge: number;
  addOnsTotal: number;
  percentSurcharge: number;
  subtotal: number;
  total: number;
  hidden: boolean; // sqft above threshold
  belowMin: boolean;
  minimum: number;
}

export function computePrice(input: PriceInput, cfg: WizardConfig): PriceResult {
  const isCommercial = input.serviceType === "commercial" || input.serviceType === "post_construction";
  const rates = isCommercial ? cfg.commercial_rates : cfg.residential_rates;
  const rate = rates[input.frequency] ?? 0;
  const base = input.sqft * rate;

  let multiplier = cfg.condition_multipliers.light;
  if (input.condition === "moderate") multiplier = cfg.condition_multipliers.moderate;
  if (input.condition === "heavy") {
    multiplier = isCommercial
      ? cfg.condition_multipliers.heavy_commercial
      : cfg.condition_multipliers.heavy_residential;
  }
  const conditioned = base * multiplier;

  // Bedroom pricing (residential family only)
  let bedroomCharge = 0;
  if (!isCommercial) {
    if (input.bedrooms >= 5) bedroomCharge = 50;
    else if (input.bedrooms >= 3) bedroomCharge = 25;
  }

  // Bathroom pricing — first 2 included
  const extraBaths = Math.max(0, input.bathrooms - 2);
  const bathroomRate = isCommercial ? 25 : 20;
  const bathroomCharge = extraBaths * bathroomRate;

  // Add-ons (flat) and percentage surcharges
  let addOnsTotal = 0;
  let percentSurcharge = 0;
  const subtotalBeforeAddons = conditioned + bedroomCharge + bathroomCharge;
  for (const a of input.addOns) {
    if (a.is_percent && a.percent) {
      percentSurcharge += subtotalBeforeAddons * (a.percent / 100);
    } else {
      addOnsTotal += a.price * (a.quantity || 1);
    }
  }

  const subtotal = subtotalBeforeAddons + addOnsTotal + percentSurcharge;
  const minimum = isCommercial ? cfg.min_commercial : cfg.min_residential;
  const total = Math.max(subtotal, minimum);
  const hidden = input.sqft > cfg.hide_price_above_sqft;

  return {
    base: round2(base),
    conditioned: round2(conditioned),
    bedroomCharge,
    bathroomCharge,
    addOnsTotal: round2(addOnsTotal),
    percentSurcharge: round2(percentSurcharge),
    subtotal: round2(subtotal),
    total: round2(total),
    hidden,
    belowMin: subtotal < minimum,
    minimum,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
