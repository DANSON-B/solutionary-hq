
-- Cleaning customer details table
CREATE TABLE public.cleaning_customer_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  property_sqft integer,
  bedrooms integer,
  bathrooms integer,
  preferred_service_type text,
  cleaning_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

ALTER TABLE public.cleaning_customer_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage cleaning customer details"
  ON public.cleaning_customer_details FOR ALL
  TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Team members can view cleaning customer details"
  ON public.cleaning_customer_details FOR SELECT
  TO authenticated
  USING (is_team_member(business_id));

-- Cleaning pricing rules table
CREATE TABLE public.cleaning_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  cleaning_type text NOT NULL,
  base_price numeric NOT NULL DEFAULT 0,
  price_per_sqft numeric NOT NULL DEFAULT 0,
  bedroom_price numeric NOT NULL DEFAULT 0,
  bathroom_price numeric NOT NULL DEFAULT 0,
  add_ons jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, cleaning_type)
);

ALTER TABLE public.cleaning_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage cleaning pricing rules"
  ON public.cleaning_pricing_rules FOR ALL
  TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Team members can view cleaning pricing rules"
  ON public.cleaning_pricing_rules FOR SELECT
  TO authenticated
  USING (is_team_member(business_id));

-- Triggers for updated_at
CREATE TRIGGER update_cleaning_customer_details_updated_at
  BEFORE UPDATE ON public.cleaning_customer_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_pricing_rules_updated_at
  BEFORE UPDATE ON public.cleaning_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
