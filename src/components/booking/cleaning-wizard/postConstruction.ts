/**
 * Post-Construction Cleaning — multi-phase tiered pricing model.
 * Pure logic module (no UI) so it can be unit-tested and reused by the CRM side.
 */

export type PCEnvironment = "residential" | "commercial";
export type PCPhaseId = "rough" | "final" | "detail";
export type PCCeiling = "standard" | "tall" | "vaulted";

export interface PCPhase {
  id: PCPhaseId;
  label: string;
  tagline: string;
  badge?: string;
  /** $ per sq ft, by environment */
  rate: Record<PCEnvironment, number>;
  /** floor price for the phase */
  minimum: Record<PCEnvironment, number>;
  scope: string[];
}

export const PC_PHASES: PCPhase[] = [
  {
    id: "rough",
    label: "Phase 1 · Rough Clean",
    tagline: "Heavy debris out, drywall dust knocked down.",
    rate: { residential: 0.22, commercial: 0.26 },
    minimum: { residential: 275, commercial: 400 },
    scope: [
      "Heavy debris & material removal",
      "Post-drywall dust mitigation",
      "Sticker, label & adhesive peeling",
      "Broom-and-vacuum rough pass",
    ],
  },
  {
    id: "final",
    label: "Phase 2 · Final Clean",
    tagline: "The white-glove pass that makes the space show-ready.",
    badge: "Most Popular",
    rate: { residential: 0.38, commercial: 0.44 },
    minimum: { residential: 425, commercial: 650 },
    scope: [
      "Detailed surface wiping throughout",
      "Interior & exterior cabinet detailing",
      "Fixture, hardware & appliance sanitization",
      "Streak-free interior window washing",
    ],
  },
  {
    id: "detail",
    label: "Phase 3 · Premium Detail",
    tagline: "Final polish right before client handover.",
    rate: { residential: 0.16, commercial: 0.19 },
    minimum: { residential: 195, commercial: 285 },
    scope: [
      "Settling-dust touch-up pass",
      "Scuff & fingerprint removal",
      "Glass, mirror & chrome polish",
      "Punch-list walkthrough with the GC",
    ],
  },
];

export const PC_CEILING_OPTIONS: { id: PCCeiling; label: string; note: string; multiplier: number }[] = [
  { id: "standard", label: "Standard", note: "Up to 9 ft", multiplier: 1 },
  { id: "tall", label: "Tall", note: "10 – 14 ft", multiplier: 1.12 },
  { id: "vaulted", label: "Vaulted / High-bay", note: "15 ft+", multiplier: 1.28 },
];

/** Discount applied when all three phases are booked together. */
export const PC_BUNDLE_DISCOUNT = 0.12;

export const PC_ROUGH_IN_ROOM_RATE = 28;

export interface PCInput {
  environment: PCEnvironment;
  sqft: number;
  ceiling: PCCeiling;
  roughInRooms: number;
  phases: PCPhaseId[];
}

export interface PCPhaseLine {
  id: PCPhaseId;
  label: string;
  amount: number;
}

export interface PCQuote {
  lines: PCPhaseLine[];
  subtotal: number;
  bundleDiscount: number;
  bundleApplied: boolean;
  total: number;
}

export function computePostConstruction(input: PCInput): PCQuote {
  const ceiling = PC_CEILING_OPTIONS.find((c) => c.id === input.ceiling) ?? PC_CEILING_OPTIONS[0];
  const rooms = Math.max(0, input.roughInRooms || 0);
  const sqft = Math.max(0, input.sqft || 0);

  const lines: PCPhaseLine[] = PC_PHASES.filter((p) => input.phases.includes(p.id)).map((p) => {
    const raw = sqft * p.rate[input.environment] * ceiling.multiplier + rooms * PC_ROUGH_IN_ROOM_RATE;
    return { id: p.id, label: p.label, amount: round2(Math.max(raw, p.minimum[input.environment])) };
  });

  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const bundleApplied = input.phases.length === PC_PHASES.length;
  const bundleDiscount = bundleApplied ? round2(subtotal * PC_BUNDLE_DISCOUNT) : 0;

  return {
    lines,
    subtotal,
    bundleDiscount,
    bundleApplied,
    total: round2(subtotal - bundleDiscount),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
