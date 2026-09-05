DROP POLICY IF EXISTS "Owners and team can view twilio config" ON public.business_twilio;

CREATE POLICY "Only owners can view twilio config"
  ON public.business_twilio FOR SELECT
  TO authenticated
  USING (private.is_business_owner(business_id));

REVOKE SELECT ON public.business_twilio FROM anon;