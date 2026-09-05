
-- Prepaid cleaning packages
CREATE TABLE public.cleaning_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  cleaning_type text NOT NULL DEFAULT 'standard',
  visits_total integer NOT NULL DEFAULT 5,
  price numeric NOT NULL DEFAULT 0,
  discount_percentage numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage cleaning packages"
  ON public.cleaning_packages FOR ALL TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));

-- Customer purchased packages (track remaining visits)
CREATE TABLE public.cleaning_package_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES cleaning_packages(id) ON DELETE CASCADE,
  visits_total integer NOT NULL,
  visits_used integer NOT NULL DEFAULT 0,
  price_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_package_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage cleaning package purchases"
  ON public.cleaning_package_purchases FOR ALL TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Team members can view cleaning package purchases"
  ON public.cleaning_package_purchases FOR SELECT TO authenticated
  USING (is_team_member(business_id));

-- Cleaning automation templates
CREATE TABLE public.cleaning_automation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_type text NOT NULL,
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  delay_days integer NOT NULL DEFAULT 0,
  message_template text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_automation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage cleaning automation templates"
  ON public.cleaning_automation_templates FOR ALL TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));
