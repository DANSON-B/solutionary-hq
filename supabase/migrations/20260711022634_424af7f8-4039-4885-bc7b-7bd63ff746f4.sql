
-- Enable RLS on Twilio/Stripe/subscription tables and add business-scoped policies

-- business_twilio: owner/team read; writes via service role only
ALTER TABLE public.business_twilio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view twilio config" ON public.business_twilio
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- twilio_logs: owner/team read
ALTER TABLE public.twilio_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view twilio logs" ON public.twilio_logs
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- sms_messages
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view sms" ON public.sms_messages
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- twilio_calls
ALTER TABLE public.twilio_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view calls" ON public.twilio_calls
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- twilio_messages
ALTER TABLE public.twilio_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view twilio messages" ON public.twilio_messages
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- twilio_phone_numbers
ALTER TABLE public.twilio_phone_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view phone numbers" ON public.twilio_phone_numbers
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- twilio_voicemails
ALTER TABLE public.twilio_voicemails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view twilio voicemails" ON public.twilio_voicemails
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- voicemail_messages
ALTER TABLE public.voicemail_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view voicemail messages" ON public.voicemail_messages
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- voicemails
ALTER TABLE public.voicemails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view voicemails" ON public.voicemails
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));
CREATE POLICY "Owners can update voicemails" ON public.voicemails
  FOR UPDATE USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- stripe_events: service role only (RLS enabled, no policies = locked out)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- subscription_plans: public catalog readable by all
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- twilio_templates: owner/team manage
ALTER TABLE public.twilio_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage templates" ON public.twilio_templates
  FOR ALL USING (private.is_business_owner(business_id))
  WITH CHECK (private.is_business_owner(business_id));
CREATE POLICY "Team can view templates" ON public.twilio_templates
  FOR SELECT USING (private.is_team_member(business_id));

-- twilio_usage
ALTER TABLE public.twilio_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view twilio usage" ON public.twilio_usage
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- twilio_usage_logs
ALTER TABLE public.twilio_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and team can view twilio usage logs" ON public.twilio_usage_logs
  FOR SELECT USING (private.is_business_owner(business_id) OR private.is_team_member(business_id));

-- Fix mutable search_path on increment functions
CREATE OR REPLACE FUNCTION public.increment_sms_usage(p_business_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE twilio_usage
    SET sms_used = sms_used + p_quantity, updated_at = now()
    WHERE business_id = p_business_id
      AND billing_month = date_trunc('month', now())::date;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_voice_usage(p_business_id uuid, p_minutes integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE twilio_usage
    SET voice_minutes_used = voice_minutes_used + p_minutes, updated_at = now()
    WHERE business_id = p_business_id
      AND billing_month = date_trunc('month', now())::date;
END;
$function$;
