
-- Review request tokens for anonymous review submission
CREATE TABLE public.review_request_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(token)
);

ALTER TABLE public.review_request_tokens ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their review request tokens
CREATE POLICY "Business owners can manage review request tokens"
  ON public.review_request_tokens FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Anon can validate tokens to load review form
CREATE POLICY "Anon can validate review tokens"
  ON public.review_request_tokens FOR SELECT TO anon
  USING (expires_at > now() AND is_used = false);

-- Anon can mark token as used after submitting review
CREATE POLICY "Anon can mark token used"
  ON public.review_request_tokens FOR UPDATE TO anon
  USING (expires_at > now() AND is_used = false)
  WITH CHECK (is_used = true);

-- Allow anon to insert reviews via valid review request token
CREATE POLICY "Anon can submit reviews via token"
  ON public.reviews FOR INSERT TO anon
  WITH CHECK (
    business_id IN (
      SELECT rrt.business_id FROM review_request_tokens rrt
      WHERE rrt.customer_id = reviews.customer_id
        AND rrt.expires_at > now()
        AND rrt.is_used = false
    )
  );

-- Allow anon to view public reviews
CREATE POLICY "Anon can view public reviews"
  ON public.reviews FOR SELECT TO anon
  USING (is_public = true);
