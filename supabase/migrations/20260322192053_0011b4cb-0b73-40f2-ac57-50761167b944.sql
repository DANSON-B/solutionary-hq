
-- Cleaning booking settings per business
CREATE TABLE public.cleaning_booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  require_deposit boolean NOT NULL DEFAULT false,
  deposit_percentage numeric NOT NULL DEFAULT 25,
  buffer_minutes integer NOT NULL DEFAULT 30,
  cancellation_policy text DEFAULT 'Free cancellation up to 24 hours before the scheduled time.',
  allow_recurring boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

ALTER TABLE public.cleaning_booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage cleaning booking settings"
  ON public.cleaning_booking_settings FOR ALL
  TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));

-- Recurring cleaning bookings
CREATE TABLE public.cleaning_recurring_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  frequency text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly')),
  preferred_day_of_week integer CHECK (preferred_day_of_week BETWEEN 0 AND 6),
  preferred_time time,
  assigned_to text,
  cleaning_type text NOT NULL DEFAULT 'standard',
  property_sqft integer,
  bedrooms integer,
  bathrooms integer,
  add_ons jsonb DEFAULT '[]'::jsonb,
  total_per_visit numeric NOT NULL DEFAULT 0,
  discount_percentage numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  next_scheduled_date date,
  last_job_id uuid REFERENCES public.jobs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_recurring_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage cleaning recurring bookings"
  ON public.cleaning_recurring_bookings FOR ALL
  TO authenticated
  USING (is_business_owner(business_id))
  WITH CHECK (is_business_owner(business_id));

CREATE POLICY "Team members can view cleaning recurring bookings"
  ON public.cleaning_recurring_bookings FOR SELECT
  TO authenticated
  USING (is_team_member(business_id));

-- Updated_at triggers
CREATE TRIGGER update_cleaning_booking_settings_updated_at
  BEFORE UPDATE ON public.cleaning_booking_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_recurring_bookings_updated_at
  BEFORE UPDATE ON public.cleaning_recurring_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
