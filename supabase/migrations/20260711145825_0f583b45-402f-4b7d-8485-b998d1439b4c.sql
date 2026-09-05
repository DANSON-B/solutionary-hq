
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_credit_cents integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS customers_referral_code_key
  ON public.customers (business_id, referral_code) WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','sms')),
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','failed','cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer NOT NULL DEFAULT 0,
  delivered_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business team can manage campaigns" ON public.marketing_campaigns
  FOR ALL TO authenticated
  USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
  WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));
CREATE TRIGGER trg_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.marketing_campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','opened','clicked')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaign_sends TO authenticated;
GRANT ALL ON public.marketing_campaign_sends TO service_role;
ALTER TABLE public.marketing_campaign_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business team can view campaign sends" ON public.marketing_campaign_sends
  FOR ALL TO authenticated
  USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
  WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON public.marketing_campaign_sends (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_business ON public.marketing_campaign_sends (business_id);
