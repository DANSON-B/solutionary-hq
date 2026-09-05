
-- Auto-generate review request token when job status changes to 'completed'
CREATE OR REPLACE FUNCTION public.auto_create_review_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Only create if no unused token already exists for this job
    IF NOT EXISTS (
      SELECT 1 FROM review_request_tokens
      WHERE job_id = NEW.id AND is_used = false AND expires_at > now()
    ) THEN
      INSERT INTO review_request_tokens (business_id, customer_id, job_id)
      VALUES (NEW.business_id, NEW.customer_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_job_completed_create_review_request
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_review_request();
