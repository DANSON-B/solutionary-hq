
-- CUSTOMERS
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS pets jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gate_code text,
  ADD COLUMN IF NOT EXISTS entry_instructions text,
  ADD COLUMN IF NOT EXISTS preferred_contact text NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS marketing_email_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_sms_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lifetime_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_job_at timestamptz;

-- CUSTOMER PROPERTIES
CREATE TABLE IF NOT EXISTS public.customer_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  address text NOT NULL,
  city text, state text, zip text,
  bedrooms int, bathrooms int, sqft int,
  gate_code text, entry_instructions text,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_properties TO authenticated;
GRANT ALL ON public.customer_properties TO service_role;
ALTER TABLE public.customer_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cust_props_owner_all" ON public.customer_properties FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()) OR private.is_team_member(business_id))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()) OR private.is_team_member(business_id));
CREATE TRIGGER trg_cust_props_updated BEFORE UPDATE ON public.customer_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_cust_props_customer ON public.customer_properties(customer_id);

-- JOBS
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS signature_name text,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- INCIDENT REPORTS
CREATE TABLE IF NOT EXISTS public.job_incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES auth.users(id),
  incident_type text NOT NULL DEFAULT 'damage',
  severity text NOT NULL DEFAULT 'low',
  description text NOT NULL,
  photo_urls text[] NOT NULL DEFAULT ARRAY[]::text[],
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_incident_reports TO authenticated;
GRANT ALL ON public.job_incident_reports TO service_role;
ALTER TABLE public.job_incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents_owner_all" ON public.job_incident_reports FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()) OR private.is_team_member(business_id))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()) OR private.is_team_member(business_id));
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON public.job_incident_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TIME ENTRIES GPS
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS clock_in_lat numeric,
  ADD COLUMN IF NOT EXISTS clock_in_lng numeric,
  ADD COLUMN IF NOT EXISTS clock_in_accuracy numeric,
  ADD COLUMN IF NOT EXISTS clock_out_lat numeric,
  ADD COLUMN IF NOT EXISTS clock_out_lng numeric,
  ADD COLUMN IF NOT EXISTS clock_out_accuracy numeric,
  ADD COLUMN IF NOT EXISTS geofence_ok boolean;

-- TEAM MEMBERS
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS commission_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_multiplier numeric NOT NULL DEFAULT 1.5;

-- BUSINESS SETTINGS
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS geofence_radius_meters int NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS require_geofence boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reschedule_on_cancel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_hours_before int NOT NULL DEFAULT 24;

-- CHECKLIST rotation
ALTER TABLE public.checklist_template_items
  ADD COLUMN IF NOT EXISTS rotation_frequency int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rotation_offset int NOT NULL DEFAULT 0;

ALTER TABLE public.cleaning_recurring_bookings
  ADD COLUMN IF NOT EXISTS visit_count int NOT NULL DEFAULT 0;

-- PAYROLL
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_periods TO authenticated;
GRANT ALL ON public.payroll_periods TO service_role;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_owner_all" ON public.payroll_periods FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE TRIGGER trg_payroll_updated BEFORE UPDATE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payroll_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  hours_worked numeric NOT NULL DEFAULT 0,
  hourly_pay_cents bigint NOT NULL DEFAULT 0,
  commission_pay_cents bigint NOT NULL DEFAULT 0,
  bonus_cents bigint NOT NULL DEFAULT 0,
  deductions_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_line_items TO authenticated;
GRANT ALL ON public.payroll_line_items TO service_role;
ALTER TABLE public.payroll_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_lines_owner_all" ON public.payroll_line_items FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- LTV trigger
CREATE OR REPLACE FUNCTION public.refresh_customer_ltv()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cid uuid;
BEGIN
  v_cid := COALESCE(NEW.customer_id, OLD.customer_id);
  IF v_cid IS NOT NULL THEN
    UPDATE public.customers c
    SET lifetime_value = COALESCE((SELECT SUM(amount_paid) FROM public.invoices WHERE customer_id = v_cid AND status = 'paid'), 0),
        last_job_at = (SELECT MAX(completed_at) FROM public.jobs WHERE customer_id = v_cid AND completed_at IS NOT NULL)
    WHERE c.id = v_cid;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ltv_on_invoice ON public.invoices;
CREATE TRIGGER trg_ltv_on_invoice AFTER INSERT OR UPDATE OF status, amount_paid ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.refresh_customer_ltv();

DROP TRIGGER IF EXISTS trg_ltv_on_job ON public.jobs;
CREATE TRIGGER trg_ltv_on_job AFTER UPDATE OF completed_at ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.refresh_customer_ltv();
