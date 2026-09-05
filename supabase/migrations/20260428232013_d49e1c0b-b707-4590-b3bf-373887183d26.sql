
-- Helper functions (SECURITY DEFINER) to break RLS recursion
CREATE OR REPLACE FUNCTION public.business_has_active_review_token(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.review_request_tokens
    WHERE business_id = _business_id
      AND expires_at > now()
      AND is_used = false
  )
$$;

CREATE OR REPLACE FUNCTION public.business_has_payable_invoice(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invoices
    WHERE business_id = _business_id
      AND stripe_payment_url IS NOT NULL
  )
$$;

DROP POLICY IF EXISTS "Anon can view business for review" ON public.businesses;
CREATE POLICY "Anon can view business for review"
  ON public.businesses
  FOR SELECT
  TO anon
  USING (public.business_has_active_review_token(id));

DROP POLICY IF EXISTS "Public can view business for invoice" ON public.businesses;
CREATE POLICY "Public can view business for invoice"
  ON public.businesses
  FOR SELECT
  TO anon
  USING (public.business_has_payable_invoice(id));
