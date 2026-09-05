-- Prevent client apps from ever reading the Twilio subaccount credential.
REVOKE ALL ON public.business_twilio FROM anon, authenticated;

GRANT SELECT (
  id, business_id, subaccount_sid, phone_number, phone_sid,
  twilio_status, sms_enabled, voice_enabled, created_at, updated_at
) ON public.business_twilio TO authenticated;

GRANT ALL ON public.business_twilio TO service_role;