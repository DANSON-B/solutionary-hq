
-- Commercial fields on customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS is_commercial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS po_number text,
  ADD COLUMN IF NOT EXISTS payment_terms_days int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS billing_address text;

-- Commercial fields on invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS po_number text,
  ADD COLUMN IF NOT EXISTS net_days int NOT NULL DEFAULT 0;

-- Geofence coordinates on properties
ALTER TABLE public.customer_properties
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- Auto-reschedule on cancel trigger
CREATE OR REPLACE FUNCTION public.auto_reschedule_cancelled_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean;
  v_offset_days int := 7;
  v_new_start timestamptz;
  v_new_end timestamptz;
BEGIN
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    SELECT COALESCE(auto_reschedule_on_cancel, false) INTO v_enabled
      FROM public.business_settings WHERE business_id = NEW.business_id;
    IF v_enabled AND NEW.scheduled_start IS NOT NULL THEN
      v_new_start := NEW.scheduled_start + (v_offset_days || ' days')::interval;
      v_new_end := COALESCE(NEW.scheduled_end, NEW.scheduled_start + interval '1 hour')
                   + (v_offset_days || ' days')::interval;
      INSERT INTO public.jobs (
        business_id, customer_id, title, description, address, total,
        assigned_team_member_id, scheduled_start, scheduled_end, status, quote_id
      ) VALUES (
        NEW.business_id, NEW.customer_id,
        NEW.title || ' (rescheduled)', NEW.description, NEW.address, NEW.total,
        NEW.assigned_team_member_id, v_new_start, v_new_end, 'scheduled', NEW.quote_id
      );
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_reschedule_cancelled_job ON public.jobs;
CREATE TRIGGER trg_auto_reschedule_cancelled_job
AFTER UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.auto_reschedule_cancelled_job();
