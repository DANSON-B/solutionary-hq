
-- Cleaning reminders table for 24h/same-day reminders
CREATE TABLE public.cleaning_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reminder_type text NOT NULL DEFAULT 'day_before',
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage cleaning reminders"
  ON public.cleaning_reminders FOR ALL
  TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Team members can view cleaning reminders"
  ON public.cleaning_reminders FOR SELECT
  TO authenticated
  USING (is_team_member(business_id));
