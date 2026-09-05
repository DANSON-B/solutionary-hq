
-- ============================================================
-- 1) Storage: stop public listing of business-assets bucket
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view business assets" ON storage.objects;
-- Public URLs (storage/v1/object/public/...) still work without an RLS policy.

-- ============================================================
-- 2) Move RLS helper functions to a private schema so they
--    are no longer exposed via PostgREST.
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

-- Re-create helpers in private schema
CREATE OR REPLACE FUNCTION private.is_business_owner(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION private.is_team_member(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE business_id = _business_id AND user_id = auth.uid() AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION private.is_business_member(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.team_members WHERE business_id = _business_id AND user_id = auth.uid() AND is_active = true)
$$;

CREATE OR REPLACE FUNCTION private.business_has_payable_invoice(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.invoices WHERE business_id = _business_id AND stripe_payment_url IS NOT NULL)
$$;

REVOKE ALL ON FUNCTION private.is_business_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_team_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_business_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.business_has_payable_invoice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_business_owner(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.is_team_member(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.is_business_member(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.business_has_payable_invoice(uuid) TO authenticated, anon, service_role;

-- ============================================================
-- 3) Drop overly broad anon policies
-- ============================================================
DROP POLICY IF EXISTS "Public can view businesses by slug" ON public.businesses;
DROP POLICY IF EXISTS "Anon can view business for review" ON public.businesses;
DROP POLICY IF EXISTS "Public can view business for invoice" ON public.businesses;

DROP POLICY IF EXISTS "Anon can view customer for review" ON public.customers;
DROP POLICY IF EXISTS "Public can view customer for invoice" ON public.customers;
DROP POLICY IF EXISTS "Anonymous users can create booking customers" ON public.customers;

DROP POLICY IF EXISTS "Public can view invoice for payment" ON public.invoices;
DROP POLICY IF EXISTS "Public can view invoice items for payment" ON public.invoice_items;

DROP POLICY IF EXISTS "Anon can view invoices via portal" ON public.invoices;
DROP POLICY IF EXISTS "Anon can view invoice items via portal" ON public.invoice_items;
DROP POLICY IF EXISTS "Anon can view quotes via portal token" ON public.quotes;
DROP POLICY IF EXISTS "Anon can approve quotes via portal" ON public.quotes;
DROP POLICY IF EXISTS "Anon can view quote items via portal" ON public.quote_items;
DROP POLICY IF EXISTS "Anon can view jobs via portal" ON public.jobs;
DROP POLICY IF EXISTS "Anon can view checklist via portal" ON public.job_checklist_items;
DROP POLICY IF EXISTS "Anon can view service requests via portal" ON public.service_requests;
DROP POLICY IF EXISTS "Anon can insert service requests via portal" ON public.service_requests;

DROP POLICY IF EXISTS "Anyone can read active coupons by code" ON public.coupons;

-- ============================================================
-- 4) Replace policies that referenced public.is_* helpers
--    so we can later drop those public helpers.
-- ============================================================
-- businesses
DROP POLICY IF EXISTS "Team members can view their business" ON public.businesses;
CREATE POLICY "Team members can view their business" ON public.businesses
  FOR SELECT TO authenticated USING (private.is_team_member(id));

-- customers
DROP POLICY IF EXISTS "Team members can view customers" ON public.customers;
CREATE POLICY "Team members can view customers" ON public.customers
  FOR SELECT TO authenticated USING (private.is_team_member(business_id));

-- coupons
DROP POLICY IF EXISTS "Business members manage coupons" ON public.coupons;
CREATE POLICY "Business members manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (private.is_business_member(business_id))
  WITH CHECK (private.is_business_member(business_id));

-- jobs
DROP POLICY IF EXISTS "Team members can view jobs" ON public.jobs;
DROP POLICY IF EXISTS "Team members can update jobs" ON public.jobs;
CREATE POLICY "Team members can view jobs" ON public.jobs
  FOR SELECT TO authenticated USING (private.is_team_member(business_id));
CREATE POLICY "Team members can update jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (private.is_team_member(business_id));

-- job_checklist_items
DROP POLICY IF EXISTS "Team members can view checklist items" ON public.job_checklist_items;
DROP POLICY IF EXISTS "Team members can update checklist items" ON public.job_checklist_items;
CREATE POLICY "Team members can view checklist items" ON public.job_checklist_items
  FOR SELECT TO authenticated USING (private.is_team_member(business_id));
CREATE POLICY "Team members can update checklist items" ON public.job_checklist_items
  FOR UPDATE TO authenticated USING (private.is_team_member(business_id));

-- team_members: restrict so members only see their OWN row + owners see all
DROP POLICY IF EXISTS "Team members can view own team" ON public.team_members;
CREATE POLICY "Team members can view own row" ON public.team_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_business_owner(business_id));

-- Drop public helpers (now using private versions)
DROP FUNCTION IF EXISTS public.is_business_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_team_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_business_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.business_has_payable_invoice(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.business_has_active_review_token(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_portal_customer_id(text) CASCADE;

-- Re-create policies that CASCADE may have dropped, using private helpers:
-- businesses owner manage policies already use auth.uid() directly so unaffected.
-- Re-add team_members owner policy if dropped
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_members' AND policyname='Business owners can manage team members') THEN
    CREATE POLICY "Business owners can manage team members" ON public.team_members
      FOR ALL TO authenticated USING (private.is_business_owner(business_id)) WITH CHECK (private.is_business_owner(business_id));
  END IF;
END $$;

-- ============================================================
-- 5) New token-scoped public RPCs (intentional public surface)
-- ============================================================

-- Public business lookup (only safe columns)
CREATE OR REPLACE FUNCTION public.get_public_business_by_slug(p_slug text)
RETURNS TABLE (id uuid, name text, slug text, industry text, logo_url text, phone text, email text, city text, state text, website text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, slug, industry, logo_url, phone, email, city, state, website
  FROM public.businesses WHERE slug = p_slug LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_business_by_id(p_id uuid)
RETURNS TABLE (id uuid, name text, slug text, industry text, logo_url text, phone text, email text, city text, state text, website text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, slug, industry, logo_url, phone, email, city, state, website
  FROM public.businesses WHERE id = p_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.search_public_businesses(p_query text)
RETURNS TABLE (id uuid, name text, slug text, city text, state text, industry text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, slug, city, state, industry
  FROM public.businesses
  WHERE slug IS NOT NULL AND name ILIKE '%' || p_query || '%'
  ORDER BY name LIMIT 10;
$$;

-- Coupon lookup (replaces enumerable SELECT policy)
CREATE OR REPLACE FUNCTION public.lookup_coupon_by_code(p_business_id uuid, p_code text)
RETURNS TABLE (id uuid, code text, discount_type text, discount_value numeric, expires_at timestamptz, single_use boolean, use_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, code, discount_type, discount_value, expires_at, single_use, use_count
  FROM public.coupons
  WHERE business_id = p_business_id AND code = upper(p_code) AND is_active = true
  LIMIT 1;
$$;

-- Gift card: require buyer_email match to retrieve code (prevents UUID disclosure)
DROP FUNCTION IF EXISTS public.get_just_purchased_gift_card(uuid);
CREATE OR REPLACE FUNCTION public.get_just_purchased_gift_card(p_id uuid, p_buyer_email text)
RETURNS TABLE (code text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT code, expires_at FROM public.cleaning_gift_cards
  WHERE id = p_id AND lower(buyer_email) = lower(p_buyer_email) LIMIT 1;
$$;

-- Invoice payment page bundle (token = invoice id is OK if combined w/ stripe_payment_url existence)
CREATE OR REPLACE FUNCTION public.get_invoice_for_payment(p_invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.invoices%ROWTYPE;
  cust record;
  biz record;
  items jsonb;
BEGIN
  SELECT * INTO inv FROM public.invoices WHERE id = p_invoice_id AND stripe_payment_url IS NOT NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT first_name, last_name, email INTO cust FROM public.customers WHERE id = inv.customer_id;
  SELECT name, email, phone, logo_url INTO biz FROM public.businesses WHERE id = inv.business_id;
  SELECT COALESCE(jsonb_agg(to_jsonb(ii.*)), '[]'::jsonb) INTO items FROM public.invoice_items ii WHERE invoice_id = inv.id;
  RETURN jsonb_build_object(
    'id', inv.id,
    'invoice_number', inv.invoice_number,
    'total', inv.total,
    'amount_paid', inv.amount_paid,
    'status', inv.status,
    'business_id', inv.business_id,
    'customer_id', inv.customer_id,
    'customers', jsonb_build_object('first_name', cust.first_name, 'last_name', cust.last_name, 'email', cust.email),
    'businesses', jsonb_build_object('name', biz.name, 'email', biz.email, 'phone', biz.phone, 'logo_url', biz.logo_url),
    'invoice_items', items
  );
END $$;

-- Review token bundle (token-bound)
CREATE OR REPLACE FUNCTION public.get_review_token_bundle(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t record; biz record; cust record;
BEGIN
  SELECT business_id, customer_id, job_id INTO t
  FROM public.review_request_tokens
  WHERE token = p_token AND is_used = false AND expires_at > now()
  LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT name, logo_url INTO biz FROM public.businesses WHERE id = t.business_id;
  SELECT first_name, last_name INTO cust FROM public.customers WHERE id = t.customer_id;
  RETURN jsonb_build_object(
    'business_id', t.business_id,
    'customer_id', t.customer_id,
    'job_id', t.job_id,
    'business', jsonb_build_object('name', biz.name, 'logo_url', biz.logo_url),
    'customer', jsonb_build_object('first_name', cust.first_name, 'last_name', cust.last_name)
  );
END $$;

-- Portal bundle: token-bound full payload (replaces all anon SELECTs through portal)
CREATE OR REPLACE FUNCTION public.get_portal_bundle(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  tk record;
  cust jsonb; biz jsonb;
  q jsonb; inv jsonb; jb jsonb; sr jsonb; cl jsonb; ph jsonb;
BEGIN
  SELECT customer_id, business_id INTO tk
  FROM public.customer_portal_tokens
  WHERE token = p_token AND expires_at > now() LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT to_jsonb(c.*) INTO cust FROM public.customers c WHERE id = tk.customer_id;
  SELECT jsonb_build_object('name', b.name, 'email', b.email, 'phone', b.phone, 'logo_url', b.logo_url)
    INTO biz FROM public.businesses b WHERE id = tk.business_id;

  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO q
  FROM (
    SELECT qq.*, COALESCE((SELECT jsonb_agg(to_jsonb(qi.*)) FROM public.quote_items qi WHERE qi.quote_id = qq.id), '[]'::jsonb) AS quote_items
    FROM public.quotes qq WHERE qq.customer_id = tk.customer_id ORDER BY qq.created_at DESC
  ) x;

  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO inv
  FROM (
    SELECT ii.*, COALESCE((SELECT jsonb_agg(to_jsonb(it.*)) FROM public.invoice_items it WHERE it.invoice_id = ii.id), '[]'::jsonb) AS invoice_items
    FROM public.invoices ii WHERE ii.customer_id = tk.customer_id ORDER BY ii.created_at DESC
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(j.*) ORDER BY j.scheduled_start DESC NULLS LAST), '[]'::jsonb) INTO jb
  FROM public.jobs j WHERE j.customer_id = tk.customer_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(s.*) ORDER BY s.created_at DESC), '[]'::jsonb) INTO sr
  FROM public.service_requests s WHERE s.customer_id = tk.customer_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(ci.*) ORDER BY ci.sort_order), '[]'::jsonb) INTO cl
  FROM public.job_checklist_items ci
  WHERE ci.job_id IN (SELECT id FROM public.jobs WHERE customer_id = tk.customer_id);

  SELECT COALESCE(jsonb_agg(to_jsonb(p.*) ORDER BY p.created_at), '[]'::jsonb) INTO ph
  FROM public.job_photos p
  WHERE p.job_id IN (SELECT id FROM public.jobs WHERE customer_id = tk.customer_id);

  RETURN jsonb_build_object(
    'customer_id', tk.customer_id,
    'business_id', tk.business_id,
    'customer', cust,
    'business', biz,
    'quotes', q,
    'invoices', inv,
    'jobs', jb,
    'service_requests', sr,
    'checklist_items', cl,
    'job_photos', ph
  );
END $$;

-- Portal mutations: token-bound
CREATE OR REPLACE FUNCTION public.portal_approve_quote(p_token text, p_quote_id uuid, p_approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c_id uuid;
BEGIN
  SELECT customer_id INTO c_id FROM public.customer_portal_tokens
    WHERE token = p_token AND expires_at > now() LIMIT 1;
  IF c_id IS NULL THEN RAISE EXCEPTION 'invalid token'; END IF;
  IF p_approve THEN
    UPDATE public.quotes SET status = 'approved', approved_at = now()
      WHERE id = p_quote_id AND customer_id = c_id;
  ELSE
    UPDATE public.quotes SET status = 'declined' WHERE id = p_quote_id AND customer_id = c_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.portal_submit_service_request(
  p_token text, p_title text, p_description text, p_preferred_date date,
  p_preferred_time text, p_address text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c_id uuid; b_id uuid; new_id uuid;
BEGIN
  SELECT customer_id, business_id INTO c_id, b_id FROM public.customer_portal_tokens
    WHERE token = p_token AND expires_at > now() LIMIT 1;
  IF c_id IS NULL THEN RAISE EXCEPTION 'invalid token'; END IF;
  INSERT INTO public.service_requests (business_id, customer_id, title, description, preferred_date, preferred_time, address)
    VALUES (b_id, c_id, p_title, p_description, p_preferred_date, p_preferred_time, p_address)
    RETURNING id INTO new_id;
  RETURN new_id;
END $$;

-- Grants for new RPCs
GRANT EXECUTE ON FUNCTION public.get_public_business_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_business_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_public_businesses(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_coupon_by_code(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_just_purchased_gift_card(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_invoice_for_payment(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_token_bundle(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_bundle(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_approve_quote(text, uuid, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_submit_service_request(text, text, text, date, text, text) TO anon, authenticated;

-- Revoke EXECUTE from PUBLIC default on these to keep ACL clean
REVOKE ALL ON FUNCTION public.get_public_business_by_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_business_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_public_businesses(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lookup_coupon_by_code(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_just_purchased_gift_card(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_invoice_for_payment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_review_token_bundle(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_portal_bundle(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.portal_approve_quote(text, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.portal_submit_service_request(text, text, text, date, text, text) FROM PUBLIC;
