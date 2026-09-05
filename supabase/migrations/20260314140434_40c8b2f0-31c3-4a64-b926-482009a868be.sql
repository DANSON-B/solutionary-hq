
-- Allow anon to view customer name via review request token
CREATE POLICY "Anon can view customer for review"
  ON public.customers FOR SELECT TO anon
  USING (id IN (
    SELECT customer_id FROM review_request_tokens
    WHERE expires_at > now() AND is_used = false
  ));

-- Allow anon to view business for review (already has slug policy, but add token-based too)
CREATE POLICY "Anon can view business for review"
  ON public.businesses FOR SELECT TO anon
  USING (id IN (
    SELECT business_id FROM review_request_tokens
    WHERE expires_at > now() AND is_used = false
  ));
