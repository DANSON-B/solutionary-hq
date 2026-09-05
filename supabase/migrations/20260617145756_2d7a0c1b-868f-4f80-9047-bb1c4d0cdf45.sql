
-- Extend team_members with workforce fields
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS pay_rate_cents INTEGER,
  ADD COLUMN IF NOT EXISTS pay_type TEXT DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Time entries (clock-in / clock-out)
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_business ON public.time_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_member ON public.time_entries(team_member_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_open ON public.time_entries(team_member_id) WHERE clock_out IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can view time entries"
  ON public.time_entries FOR SELECT TO authenticated
  USING (public.is_business_member(business_id));

CREATE POLICY "Business members can insert time entries"
  ON public.time_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Business members can update time entries"
  ON public.time_entries FOR UPDATE TO authenticated
  USING (public.is_business_member(business_id))
  WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Business owners can delete time entries"
  ON public.time_entries FOR DELETE TO authenticated
  USING (public.is_business_owner(business_id));

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-compute minutes on clock_out
CREATE OR REPLACE FUNCTION public.compute_time_entry_minutes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL THEN
    NEW.minutes := GREATEST(0, EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in))::int / 60);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_compute_time_entry_minutes
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.compute_time_entry_minutes();
