
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS assigned_team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_assigned_member ON public.jobs(assigned_team_member_id);

-- Backfill from existing text field where it's a valid UUID matching a team member
UPDATE public.jobs j
SET assigned_team_member_id = tm.id
FROM public.team_members tm
WHERE j.assigned_team_member_id IS NULL
  AND j.assigned_to IS NOT NULL
  AND j.assigned_to ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND tm.id::text = j.assigned_to
  AND tm.business_id = j.business_id;
