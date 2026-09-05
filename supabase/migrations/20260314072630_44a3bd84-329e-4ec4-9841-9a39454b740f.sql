
-- Customer portal access tokens (no auth required, token-based access)
CREATE TABLE public.customer_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Business owners can manage tokens
CREATE POLICY "Business owners can manage portal tokens"
ON public.customer_portal_tokens FOR ALL TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Anon can read tokens to validate access
CREATE POLICY "Anon can validate portal tokens"
ON public.customer_portal_tokens FOR SELECT TO anon
USING (expires_at > now());

-- Security definer function to get customer data by portal token
CREATE OR REPLACE FUNCTION public.get_portal_customer_id(portal_token TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id FROM customer_portal_tokens
  WHERE token = portal_token AND expires_at > now()
  LIMIT 1
$$;

-- Anon can view quotes for portal access (via token-linked customer)
CREATE POLICY "Anon can view quotes via portal token"
ON public.quotes FOR SELECT TO anon
USING (
  customer_id IN (
    SELECT customer_id FROM customer_portal_tokens WHERE expires_at > now()
  )
);

-- Anon can update quote status (approve/decline) via portal
CREATE POLICY "Anon can approve quotes via portal"
ON public.quotes FOR UPDATE TO anon
USING (
  customer_id IN (
    SELECT customer_id FROM customer_portal_tokens WHERE expires_at > now()
  )
)
WITH CHECK (
  customer_id IN (
    SELECT customer_id FROM customer_portal_tokens WHERE expires_at > now()
  )
);

-- Anon can view quote items via portal
CREATE POLICY "Anon can view quote items via portal"
ON public.quote_items FOR SELECT TO anon
USING (
  quote_id IN (
    SELECT id FROM quotes WHERE customer_id IN (
      SELECT customer_id FROM customer_portal_tokens WHERE expires_at > now()
    )
  )
);

-- Anon can view invoices via portal (broader than just stripe ones)
CREATE POLICY "Anon can view invoices via portal"
ON public.invoices FOR SELECT TO anon
USING (
  customer_id IN (
    SELECT customer_id FROM customer_portal_tokens WHERE expires_at > now()
  )
);

-- Anon can view invoice items via portal
CREATE POLICY "Anon can view invoice items via portal"
ON public.invoice_items FOR SELECT TO anon
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE customer_id IN (
      SELECT customer_id FROM customer_portal_tokens WHERE expires_at > now()
    )
  )
);
