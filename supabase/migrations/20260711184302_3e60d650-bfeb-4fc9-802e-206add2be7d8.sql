
CREATE POLICY "Owners manage gift card packages"
ON public.cleaning_gift_card_packages
FOR ALL
TO authenticated
USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));

CREATE POLICY "No client inserts" ON public.voicemails
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client inserts" ON public.twilio_calls
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client inserts" ON public.sms_messages
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client inserts" ON public.twilio_messages
  FOR INSERT TO anon, authenticated WITH CHECK (false);
