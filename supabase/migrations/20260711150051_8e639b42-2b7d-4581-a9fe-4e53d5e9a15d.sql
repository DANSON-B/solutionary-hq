
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly','quarterly','yearly')),
  member_discount_percent numeric NOT NULL DEFAULT 0,
  included_visits integer NOT NULL DEFAULT 0,
  perks jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business team manages memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
  WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));
CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.customer_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  renews_at timestamptz,
  cancelled_at timestamptz,
  visits_used_this_period integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_memberships TO authenticated;
GRANT ALL ON public.customer_memberships TO service_role;
ALTER TABLE public.customer_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business team manages customer memberships" ON public.customer_memberships
  FOR ALL TO authenticated
  USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
  WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));
CREATE TRIGGER trg_customer_memberships_updated_at BEFORE UPDATE ON public.customer_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_customer_memberships_customer ON public.customer_memberships (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_business ON public.customer_memberships (business_id);
