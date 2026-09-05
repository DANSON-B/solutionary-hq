
CREATE TABLE public.industry_change_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_industry TEXT,
  new_industry TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.industry_change_log TO authenticated;
GRANT ALL ON public.industry_change_log TO service_role;

ALTER TABLE public.industry_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their industry log"
ON public.industry_change_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = industry_change_log.business_id
      AND b.owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can insert industry log entries"
ON public.industry_change_log FOR INSERT
TO authenticated
WITH CHECK (
  changed_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id
      AND b.owner_id = auth.uid()
  )
);

CREATE INDEX idx_industry_change_log_business ON public.industry_change_log(business_id, created_at DESC);
