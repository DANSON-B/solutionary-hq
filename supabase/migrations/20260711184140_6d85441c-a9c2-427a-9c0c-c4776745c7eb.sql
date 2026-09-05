
-- Remove the insecure anon insert policy that didn't validate the token
DROP POLICY IF EXISTS "Anon can submit reviews via token" ON public.reviews;

-- Create a SECURITY DEFINER RPC that requires the actual token string
CREATE OR REPLACE FUNCTION public.submit_review_with_token(
  p_token text,
  p_rating int,
  p_comment text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t record;
  new_id uuid;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Invalid rating';
  END IF;

  SELECT business_id, customer_id, job_id
  INTO t
  FROM public.review_request_tokens
  WHERE token = p_token
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired review token';
  END IF;

  INSERT INTO public.reviews (business_id, customer_id, job_id, rating, comment, is_public)
  VALUES (t.business_id, t.customer_id, t.job_id, p_rating,
          NULLIF(btrim(COALESCE(p_comment, '')), ''), true)
  RETURNING id INTO new_id;

  UPDATE public.review_request_tokens
  SET is_used = true
  WHERE token = p_token AND is_used = false AND expires_at > now();

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_review_with_token(text, int, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_review_with_token(text, int, text) TO anon, authenticated;
