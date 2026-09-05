-- COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  expires_at timestamptz,
  single_use boolean NOT NULL DEFAULT false,
  use_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT ON public.coupons TO anon;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage coupons"
  ON public.coupons FOR ALL
  USING (public.is_business_member(business_id))
  WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Anyone can read active coupons by code"
  ON public.coupons FOR SELECT
  TO anon
  USING (is_active = true);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CALL QUOTES
CREATE TABLE public.call_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,

  -- Inline customer snapshot (call may be a fresh lead)
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  service_address text,
  lead_source text,
  call_notes text,

  -- Service config
  service_type text NOT NULL,
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 0,
  kitchens integer NOT NULL DEFAULT 0,
  living_rooms integer NOT NULL DEFAULT 0,
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Pricing
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  manual_override boolean NOT NULL DEFAULT false,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code text,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Payment
  deposit_percent integer NOT NULL DEFAULT 50,
  payment_mode text,
  stripe_session_id text,
  amount_paid numeric NOT NULL DEFAULT 0,

  -- Lifecycle
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','paid','booked','expired','cancelled')),
  share_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  paid_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX call_quotes_business_idx ON public.call_quotes(business_id, created_at DESC);
CREATE INDEX call_quotes_token_idx ON public.call_quotes(share_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_quotes TO authenticated;
GRANT SELECT, UPDATE ON public.call_quotes TO anon;
GRANT ALL ON public.call_quotes TO service_role;

ALTER TABLE public.call_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage call quotes"
  ON public.call_quotes FOR ALL
  USING (public.is_business_member(business_id))
  WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Anyone can view call quote by token"
  ON public.call_quotes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can mark viewed/accepted by token"
  ON public.call_quotes FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER call_quotes_updated_at
  BEFORE UPDATE ON public.call_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();