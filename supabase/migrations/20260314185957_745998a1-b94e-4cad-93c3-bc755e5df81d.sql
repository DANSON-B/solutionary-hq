
-- Allow anonymous users to view jobs via portal token
CREATE POLICY "Anon can view jobs via portal"
ON public.jobs
FOR SELECT
TO anon
USING (
  customer_id IN (
    SELECT customer_id FROM customer_portal_tokens
    WHERE expires_at > now()
  )
);

-- Allow anonymous users to view job checklist items via portal
CREATE POLICY "Anon can view checklist via portal"
ON public.job_checklist_items
FOR SELECT
TO anon
USING (
  job_id IN (
    SELECT j.id FROM jobs j
    WHERE j.customer_id IN (
      SELECT customer_id FROM customer_portal_tokens
      WHERE expires_at > now()
    )
  )
);
