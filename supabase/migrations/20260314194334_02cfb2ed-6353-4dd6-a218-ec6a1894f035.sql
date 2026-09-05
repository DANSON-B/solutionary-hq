
-- Team availability / time-off tracking
CREATE TABLE public.team_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'time_off', -- 'time_off', 'available', 'partial'
  start_time TIME, -- null = all day
  end_time TIME,   -- null = all day
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (team_member_id, date, type)
);

ALTER TABLE public.team_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage team availability"
ON public.team_availability
FOR ALL
TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
