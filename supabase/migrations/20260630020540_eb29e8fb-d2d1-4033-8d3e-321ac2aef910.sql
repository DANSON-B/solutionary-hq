
-- =========================
-- 1. CALL QUOTES: replace open anon SELECT/UPDATE with token RPCs
-- =========================
DROP POLICY IF EXISTS "Anyone can view call quote by token" ON public.call_quotes;
DROP POLICY IF EXISTS "Anyone can mark viewed/accepted by token" ON public.call_quotes;

CREATE OR REPLACE FUNCTION public.get_call_quote_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.call_quotes%ROWTYPE;
  b record;
BEGIN
  SELECT * INTO q FROM public.call_quotes WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT name, logo_url INTO b FROM public.businesses WHERE id = q.business_id;
  RETURN jsonb_build_object(
    'id', q.id,
    'business_id', q.business_id,
    'share_token', q.share_token,
    'status', q.status,
    'service_type', q.service_type,
    'service_address', q.service_address,
    'customer_name', q.customer_name,
    'bedrooms', q.bedrooms,
    'bathrooms', q.bathrooms,
    'kitchens', q.kitchens,
    'living_rooms', q.living_rooms,
    'addons', q.addons,
    'subtotal', q.subtotal,
    'discount_amount', q.discount_amount,
    'coupon_code', q.coupon_code,
    'total', q.total,
    'expires_at', q.expires_at,
    'viewed_at', q.viewed_at,
    'accepted_at', q.accepted_at,
    'paid_at', q.paid_at,
    'breakdown', q.breakdown,
    'businesses', jsonb_build_object('name', b.name, 'logo_url', b.logo_url)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_call_quote_viewed(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.call_quotes
  SET viewed_at = COALESCE(viewed_at, now()),
      status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END
  WHERE share_token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.accept_call_quote(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.call_quotes
  SET accepted_at = now(), status = 'accepted'
  WHERE share_token = p_token
    AND (expires_at IS NULL OR expires_at > now())
    AND status NOT IN ('paid');
$$;

REVOKE ALL ON FUNCTION public.get_call_quote_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_call_quote_viewed(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_call_quote(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_call_quote_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_call_quote_viewed(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_call_quote(text) TO anon, authenticated;

-- =========================
-- 2. CUSTOMER PORTAL TOKENS
-- =========================
DROP POLICY IF EXISTS "Anon can validate portal tokens" ON public.customer_portal_tokens;

CREATE OR REPLACE FUNCTION public.get_portal_token_data(p_token text)
RETURNS TABLE (customer_id uuid, business_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id, business_id
  FROM public.customer_portal_tokens
  WHERE token = p_token AND expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_portal_token_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_portal_token_data(text) TO anon, authenticated;

-- =========================
-- 3. REVIEW REQUEST TOKENS
-- =========================
DROP POLICY IF EXISTS "Anon can validate review tokens" ON public.review_request_tokens;
DROP POLICY IF EXISTS "Anon can mark token used" ON public.review_request_tokens;

CREATE OR REPLACE FUNCTION public.get_review_token_data(p_token text)
RETURNS TABLE (id uuid, business_id uuid, customer_id uuid, job_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, business_id, customer_id, job_id
  FROM public.review_request_tokens
  WHERE token = p_token
    AND is_used = false
    AND expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mark_review_token_used(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.review_request_tokens
  SET is_used = true
  WHERE token = p_token AND is_used = false AND expires_at > now();
$$;

REVOKE ALL ON FUNCTION public.get_review_token_data(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_review_token_used(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_review_token_data(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_review_token_used(text) TO anon, authenticated;

-- =========================
-- 4. CLEANING GIFT CARDS
-- =========================
DROP POLICY IF EXISTS "Anon can view gift card by code" ON public.cleaning_gift_cards;

-- Allow anon to read back ONLY a row they just inserted (matched by exact code)
-- via a secure function. Also useful for redemption lookup.
CREATE OR REPLACE FUNCTION public.lookup_gift_card_by_code(p_code text)
RETURNS TABLE (
  id uuid, code text, amount numeric, status text,
  cleaning_type text, rooms_included text[],
  expires_at timestamptz, business_id uuid,
  recipient_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, code, amount, status, cleaning_type, rooms_included,
         expires_at, business_id, recipient_name
  FROM public.cleaning_gift_cards
  WHERE code = p_code
    AND status = 'active'
    AND expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_just_purchased_gift_card(p_id uuid)
RETURNS TABLE (code text, expires_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT code, expires_at FROM public.cleaning_gift_cards WHERE id = p_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_gift_card_by_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_just_purchased_gift_card(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_gift_card_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_just_purchased_gift_card(uuid) TO anon, authenticated;

-- =========================
-- 5. STORAGE: business-assets ownership checks
-- =========================
DROP POLICY IF EXISTS "Authenticated users can update own business assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own business assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload business assets" ON storage.objects;

CREATE POLICY "Business owners can upload business assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'business-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can update business assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'business-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'business-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can delete business assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'business-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- =========================
-- 6. STORAGE: job-photos remove public anon SELECT/list
-- =========================
DROP POLICY IF EXISTS "Public can view job photos" ON storage.objects;

-- =========================
-- 7. Lock down internal helper functions: revoke anon EXECUTE,
--    set search_path on email queue helpers.
-- =========================
REVOKE EXECUTE ON FUNCTION public.is_business_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.business_has_payable_invoice(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.business_has_active_review_token(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_portal_customer_id(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_create_business_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_create_review_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_time_entry_minutes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq, extensions;
