export type ServiceType = "residential" | "deep" | "move" | "commercial" | "post_construction";
export type Frequency = "one_time" | "weekly" | "biweekly" | "monthly" | "daily";
export type Condition = "light" | "moderate" | "heavy";

export interface AddOn {
  id: string;
  label: string;
  price: number;
  category: string;
  enabled: boolean;
  is_percent?: boolean;
  percent?: number;
}

export interface WizardConfig {
  business_id: string;
  services: Record<ServiceType, boolean>;
  frequencies: Record<Frequency, boolean>;
  residential_rates: Record<Frequency, number>;
  commercial_rates: Record<Frequency, number>;
  condition_multipliers: {
    light: number;
    moderate: number;
    heavy_residential: number;
    heavy_commercial: number;
  };
  residential_addons: AddOn[];
  commercial_addons: AddOn[];
  min_residential: number;
  min_commercial: number;
  hide_price_above_sqft: number;
  custom_services?: CustomService[];
}

export interface CustomService {
  id: string;
  label: string;
  price: number;
  enabled: boolean;
}

export interface SelectedAddOn {
  id: string;
  label: string;
  price: number;
  quantity: number;
  is_percent?: boolean;
  percent?: number;
}

export const DEFAULT_CONFIG: Omit<WizardConfig, "business_id"> = {
  services: { residential: true, deep: true, move: true, commercial: true, post_construction: true },
  frequencies: { one_time: true, weekly: true, biweekly: true, monthly: true, daily: true },
  residential_rates: { one_time: 0.20, weekly: 0.12, biweekly: 0.14, monthly: 0.16, daily: 0.10 },
  commercial_rates: { one_time: 0.22, weekly: 0.12, biweekly: 0.13, monthly: 0.15, daily: 0.10 },
  condition_multipliers: { light: 1.0, moderate: 1.15, heavy_residential: 1.30, heavy_commercial: 1.35 },
  residential_addons: [
    { id: "fridge", label: "Inside Fridge", price: 25, category: "popular", enabled: true },
    { id: "oven", label: "Inside Oven", price: 30, category: "popular", enabled: true },
    { id: "int_windows", label: "Interior Windows (each)", price: 5, category: "popular", enabled: true },
    { id: "pet_hair", label: "Pet Hair Removal", price: 50, category: "popular", enabled: true },
    { id: "cabinets", label: "Cabinets Interior", price: 40, category: "kitchen", enabled: true },
    { id: "pantry", label: "Pantry Cleaning", price: 35, category: "kitchen", enabled: true },
    { id: "mold", label: "Mold Treatment", price: 35, category: "bathroom", enabled: true },
    { id: "grout", label: "Grout Scrubbing", price: 50, category: "bathroom", enabled: true },
    { id: "blinds", label: "Blinds (per room)", price: 15, category: "detail", enabled: true },
    { id: "baseboards", label: "Baseboards Hand Wash", price: 40, category: "detail", enabled: true },
    { id: "closets", label: "Closets (each)", price: 10, category: "whole_home", enabled: true },
    { id: "garage", label: "Garage Cleaning", price: 50, category: "whole_home", enabled: true },
    { id: "patio", label: "Patio Cleaning", price: 40, category: "whole_home", enabled: true },
    { id: "carpet_shampoo", label: "Carpet Shampoo (per room)", price: 40, category: "premium", enabled: true },
    { id: "disinfection", label: "Disinfection", price: 75, category: "premium", enabled: true },
  ],
  commercial_addons: [
    { id: "glass", label: "Glass Cleaning (per panel)", price: 4, category: "standard", enabled: true },
    { id: "carpet_sqft", label: "Carpet Shampoo (per sq ft)", price: 0.15, category: "standard", enabled: true },
    { id: "floor_buff", label: "Floor Buffing (per sq ft)", price: 0.25, category: "standard", enabled: true },
    { id: "disinfection_c", label: "Disinfection", price: 100, category: "standard", enabled: true },
    { id: "restock", label: "Restocking Supplies", price: 25, category: "standard", enabled: true },
    { id: "day_porter", label: "Day Porter (per hour)", price: 35, category: "standard", enabled: true },
    { id: "trash_haul", label: "Trash Haul", price: 50, category: "standard", enabled: true },
    { id: "post_construction", label: "Post-Construction (per sq ft)", price: 0.40, category: "premium", enabled: true },
    { id: "medical", label: "Medical Cleaning (+20%)", price: 0, category: "premium", enabled: true, is_percent: true, percent: 20 },

    // ===== Post-Construction Cleaning Add-Ons (Residential + Commercial) =====
    // Step 1: Dust Level / Scope (percent surcharges)
    { id: "pc_dust_light", label: "Light Construction Dust", price: 0, category: "pc_scope", enabled: true, is_percent: true, percent: 0 },
    { id: "pc_dust_medium", label: "Medium Dust + Debris (+15%)", price: 0, category: "pc_scope", enabled: true, is_percent: true, percent: 15 },
    { id: "pc_dust_heavy", label: "Heavy Post-Construction Dust (+30%)", price: 0, category: "pc_scope", enabled: true, is_percent: true, percent: 30 },

    // Step 2: Heavy Dusting & Detail
    { id: "pc_high_dust", label: "High Dusting (ceilings, beams, vents)", price: 120, category: "pc_dusting", enabled: true },
    { id: "pc_wall_wipe", label: "Wall Wipe-Down", price: 150, category: "pc_dusting", enabled: true },
    { id: "pc_baseboards", label: "Baseboards + Trim Detailing", price: 80, category: "pc_dusting", enabled: true },
    { id: "pc_cab_dust", label: "Cabinet Interior Dusting", price: 60, category: "pc_dusting", enabled: true },
    { id: "pc_outlets", label: "Outlet / Switch Cleaning", price: 40, category: "pc_dusting", enabled: true },

    // Step 3: Windows & Glass
    { id: "pc_int_windows", label: "Interior Windows", price: 90, category: "pc_windows", enabled: true },
    { id: "pc_ext_windows", label: "Exterior Windows", price: 140, category: "pc_windows", enabled: true },
    { id: "pc_tracks", label: "Tracks + Frames Cleaning", price: 60, category: "pc_windows", enabled: true },
    { id: "pc_sticker", label: "Sticker / Paint / Adhesive Removal", price: 75, category: "pc_windows", enabled: true },
    { id: "pc_partitions", label: "Glass Partitions / Mirrors", price: 70, category: "pc_windows", enabled: true },

    // Step 4: Residue Removal
    { id: "pc_paint_splatter", label: "Paint Splatter Removal", price: 90, category: "pc_residue", enabled: true },
    { id: "pc_caulk", label: "Caulk / Silicone Removal", price: 70, category: "pc_residue", enabled: true },
    { id: "pc_glue", label: "Adhesive / Glue Removal", price: 65, category: "pc_residue", enabled: true },
    { id: "pc_grout_haze", label: "Grout Haze Removal", price: 110, category: "pc_residue", enabled: true },

    // Step 5: Surface Finishing
    { id: "pc_floor_deep", label: "Floor Deep Clean", price: 180, category: "pc_finishing", enabled: true },
    { id: "pc_counter", label: "Countertop Detailing", price: 60, category: "pc_finishing", enabled: true },
    { id: "pc_doors", label: "Door Frames / Trim Polish", price: 70, category: "pc_finishing", enabled: true },
    { id: "pc_fixtures", label: "Fixture Polishing", price: 55, category: "pc_finishing", enabled: true },

    // Step 6: Commercial Add-Ons
    { id: "pc_restroom", label: "Restroom Deep Clean", price: 120, category: "pc_commercial", enabled: true },
    { id: "pc_breakroom", label: "Breakroom / Kitchenette Clean", price: 95, category: "pc_commercial", enabled: true },
    { id: "pc_lobby", label: "Lobby / Reception Clean", price: 110, category: "pc_commercial", enabled: true },
    { id: "pc_elevator", label: "Elevator Detailing", price: 85, category: "pc_commercial", enabled: true },
    { id: "pc_carpet_spot", label: "Carpet Spot Treatment", price: 75, category: "pc_commercial", enabled: true },

    // Step 7: Residential Add-Ons
    { id: "pc_appliance", label: "Appliance Interior Cleaning", price: 90, category: "pc_residential", enabled: true },
    { id: "pc_drawers", label: "Cabinet / Drawer Interiors", price: 70, category: "pc_residential", enabled: true },
    { id: "pc_closets", label: "Closet Cleaning", price: 50, category: "pc_residential", enabled: true },
    { id: "pc_garage", label: "Garage Cleanup", price: 100, category: "pc_residential", enabled: true },
    { id: "pc_patio", label: "Patio / Entry Wash-Down", price: 80, category: "pc_residential", enabled: true },

    // Step 8: Final Cleanup Upsells
    { id: "pc_debris", label: "Debris Bagging / Removal", price: 120, category: "pc_final", enabled: true },
    { id: "pc_punchlist", label: "Punch-List Cleanup", price: 150, category: "pc_final", enabled: true },
    { id: "pc_return_dust", label: "48–72 Hour Return Dust Clean", price: 175, category: "pc_final", enabled: true },
    { id: "pc_hepa", label: "HEPA Re-Clean Pass", price: 200, category: "pc_final", enabled: true },
    { id: "pc_odor", label: "Odor Neutralization", price: 90, category: "pc_final", enabled: true },
  ],
  min_residential: 150,
  min_commercial: 200,
  hide_price_above_sqft: 3000,
  custom_services: [],
};

export const ADDON_CATEGORY_LABELS: Record<string, string> = {
  popular: "Most Popular",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  detail: "Detail",
  whole_home: "Whole Home",
  premium: "Premium",
  custom: "Additional Services",
  standard: "Standard",

  pc_scope: "Step 1 · Dust Level / Scope",
  pc_dusting: "Step 2 · Heavy Dusting & Detail",
  pc_windows: "Step 3 · Windows & Glass",
  pc_residue: "Step 4 · Residue Removal",
  pc_finishing: "Step 5 · Surface Finishing",
  pc_commercial: "Step 6 · Commercial Add-Ons",
  pc_residential: "Step 7 · Residential Add-Ons",
  pc_final: "Step 8 · Final Cleanup Upsells",
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  residential: "Residential Cleaning",
  deep: "Deep Cleaning",
  move: "Move-In / Move-Out",
  commercial: "Light Commercial Cleaning",
  post_construction: "Post-Construction Cleaning",
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  one_time: "One-Time",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  daily: "Daily",
};
