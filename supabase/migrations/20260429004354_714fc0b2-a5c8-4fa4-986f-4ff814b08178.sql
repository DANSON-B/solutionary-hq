
CREATE TABLE public.cleaning_wizard_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL UNIQUE,
  services jsonb NOT NULL DEFAULT '{"residential":true,"deep":true,"move":true,"commercial":true}'::jsonb,
  frequencies jsonb NOT NULL DEFAULT '{"one_time":true,"weekly":true,"biweekly":true,"monthly":true,"daily":true}'::jsonb,
  residential_rates jsonb NOT NULL DEFAULT '{"one_time":0.20,"weekly":0.12,"biweekly":0.14,"monthly":0.16,"daily":0.10}'::jsonb,
  commercial_rates jsonb NOT NULL DEFAULT '{"one_time":0.22,"weekly":0.12,"biweekly":0.13,"monthly":0.15,"daily":0.10}'::jsonb,
  condition_multipliers jsonb NOT NULL DEFAULT '{"light":1.0,"moderate":1.15,"heavy_residential":1.30,"heavy_commercial":1.35}'::jsonb,
  residential_addons jsonb NOT NULL DEFAULT '[
    {"id":"fridge","label":"Inside Fridge","price":25,"category":"popular","enabled":true},
    {"id":"oven","label":"Inside Oven","price":30,"category":"popular","enabled":true},
    {"id":"int_windows","label":"Interior Windows (each)","price":5,"category":"popular","enabled":true},
    {"id":"pet_hair","label":"Pet Hair Removal","price":50,"category":"popular","enabled":true},
    {"id":"cabinets","label":"Cabinets Interior","price":40,"category":"kitchen","enabled":true},
    {"id":"pantry","label":"Pantry Cleaning","price":35,"category":"kitchen","enabled":true},
    {"id":"mold","label":"Mold Treatment","price":35,"category":"bathroom","enabled":true},
    {"id":"grout","label":"Grout Scrubbing","price":50,"category":"bathroom","enabled":true},
    {"id":"blinds","label":"Blinds (per room)","price":15,"category":"detail","enabled":true},
    {"id":"baseboards","label":"Baseboards Hand Wash","price":40,"category":"detail","enabled":true},
    {"id":"closets","label":"Closets (each)","price":10,"category":"whole_home","enabled":true},
    {"id":"garage","label":"Garage Cleaning","price":50,"category":"whole_home","enabled":true},
    {"id":"patio","label":"Patio Cleaning","price":40,"category":"whole_home","enabled":true},
    {"id":"carpet_shampoo","label":"Carpet Shampoo (per room)","price":40,"category":"premium","enabled":true},
    {"id":"disinfection","label":"Disinfection","price":75,"category":"premium","enabled":true}
  ]'::jsonb,
  commercial_addons jsonb NOT NULL DEFAULT '[
    {"id":"glass","label":"Glass Cleaning (per panel)","price":4,"category":"standard","enabled":true},
    {"id":"carpet_sqft","label":"Carpet Shampoo (per sq ft)","price":0.15,"category":"standard","enabled":true},
    {"id":"floor_buff","label":"Floor Buffing (per sq ft)","price":0.25,"category":"standard","enabled":true},
    {"id":"disinfection_c","label":"Disinfection","price":100,"category":"standard","enabled":true},
    {"id":"restock","label":"Restocking Supplies","price":25,"category":"standard","enabled":true},
    {"id":"day_porter","label":"Day Porter (per hour)","price":35,"category":"standard","enabled":true},
    {"id":"trash_haul","label":"Trash Haul","price":50,"category":"standard","enabled":true},
    {"id":"post_construction","label":"Post-Construction (per sq ft)","price":0.40,"category":"premium","enabled":true},
    {"id":"medical","label":"Medical Cleaning (+20%)","price":0,"category":"premium","enabled":true,"is_percent":true,"percent":20}
  ]'::jsonb,
  min_residential numeric NOT NULL DEFAULT 150,
  min_commercial numeric NOT NULL DEFAULT 200,
  hide_price_above_sqft integer NOT NULL DEFAULT 3000,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_wizard_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wizard config"
  ON public.cleaning_wizard_config FOR SELECT
  USING (true);

CREATE POLICY "Business owners can insert wizard config"
  ON public.cleaning_wizard_config FOR INSERT
  TO authenticated
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Business owners can update wizard config"
  ON public.cleaning_wizard_config FOR UPDATE
  TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Business owners can delete wizard config"
  ON public.cleaning_wizard_config FOR DELETE
  TO authenticated
  USING (is_business_owner(business_id));

CREATE TRIGGER update_cleaning_wizard_config_updated_at
  BEFORE UPDATE ON public.cleaning_wizard_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
