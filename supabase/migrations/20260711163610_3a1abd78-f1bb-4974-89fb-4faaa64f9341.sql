
-- Harden call_quote_events: ensure only authenticated business owners/team can read; no anon access
REVOKE ALL ON public.call_quote_events FROM anon;
GRANT SELECT, INSERT ON public.call_quote_events TO authenticated;
GRANT ALL ON public.call_quote_events TO service_role;

-- Harden customer_portal_tokens: revoke anon and ensure only owner-scoped access; customer portal must go through SECURITY DEFINER RPCs
REVOKE ALL ON public.customer_portal_tokens FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_portal_tokens TO authenticated;
GRANT ALL ON public.customer_portal_tokens TO service_role;

-- Add explicit restrictive default-deny for anon on both tables via policy (defense in depth)
DROP POLICY IF EXISTS "Deny anon access to portal tokens" ON public.customer_portal_tokens;
CREATE POLICY "Deny anon access to portal tokens"
  ON public.customer_portal_tokens
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anon access to call quote events" ON public.call_quote_events;
CREATE POLICY "Deny anon access to call quote events"
  ON public.call_quote_events
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
