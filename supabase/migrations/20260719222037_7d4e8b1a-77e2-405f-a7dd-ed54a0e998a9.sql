
-- 1. Add frequency columns to call_quotes
ALTER TABLE public.call_quotes
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS frequency_discount_percent numeric NOT NULL DEFAULT 0;

-- 2. Add frequency_discounts to pricing_rules
ALTER TABLE public.pricing_rules
  ADD COLUMN IF NOT EXISTS frequency_discounts jsonb NOT NULL
    DEFAULT '{"one_time":0,"weekly":15,"biweekly":10,"monthly":5}'::jsonb;

-- 3. Update get_pricing_rules_for_token to include frequency_discounts
CREATE OR REPLACE FUNCTION public.get_pricing_rules_for_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  biz_id uuid;
  r public.pricing_rules%ROWTYPE;
BEGIN
  SELECT business_id INTO biz_id FROM public.call_quotes WHERE share_token = p_token LIMIT 1;
  IF biz_id IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO r FROM public.pricing_rules WHERE business_id = biz_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'min_job_price', 120,
      'tier_multipliers', '{"basic":0.85,"standard":1,"deep":1.4}'::jsonb,
      'room_prices', '{"bedrooms":25,"bathrooms":35,"kitchens":40,"living_rooms":20,"dining_rooms":15,"offices":20,"finished_basement":45,"laundry_room":15}'::jsonb,
      'sqft_tier_prices', '{"u1000":140,"1000_1500":175,"1500_2000":210,"2000_2500":255,"2500_3000":300,"3000_4000":360,"4000p":425}'::jsonb,
      'discount_by_tier', '{"basic":0,"standard":0,"deep":0}'::jsonb,
      'frequency_discounts', '{"one_time":0,"weekly":15,"biweekly":10,"monthly":5}'::jsonb
    );
  END IF;
  RETURN jsonb_build_object(
    'min_job_price', r.min_job_price,
    'tier_multipliers', r.tier_multipliers,
    'room_prices', r.room_prices,
    'sqft_tier_prices', r.sqft_tier_prices,
    'discount_by_tier', r.discount_by_tier,
    'frequency_discounts', COALESCE(r.frequency_discounts, '{"one_time":0,"weekly":15,"biweekly":10,"monthly":5}'::jsonb)
  );
END; $function$;

-- 4. Update get_call_quote_by_token to include frequency + frequency_discount_percent
CREATE OR REPLACE FUNCTION public.get_call_quote_by_token(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE q public.call_quotes%ROWTYPE; b record;
BEGIN
  SELECT * INTO q FROM public.call_quotes WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT name, logo_url INTO b FROM public.businesses WHERE id = q.business_id;
  RETURN jsonb_build_object(
    'id', q.id, 'business_id', q.business_id, 'share_token', q.share_token,
    'status', q.status, 'service_type', q.service_type, 'service_tier', q.service_tier,
    'service_address', q.service_address, 'customer_name', q.customer_name,
    'bedrooms', q.bedrooms, 'bathrooms', q.bathrooms, 'kitchens', q.kitchens,
    'living_rooms', q.living_rooms, 'dining_rooms', q.dining_rooms, 'offices', q.offices,
    'finished_basement', q.finished_basement, 'laundry_room', q.laundry_room,
    'sqft_tier', q.sqft_tier, 'allow_customer_edits', q.allow_customer_edits,
    'addons', q.addons, 'subtotal', q.subtotal, 'discount_amount', q.discount_amount,
    'coupon_code', q.coupon_code, 'total', q.total, 'deposit_percent', q.deposit_percent,
    'expires_at', q.expires_at, 'viewed_at', q.viewed_at, 'accepted_at', q.accepted_at,
    'paid_at', q.paid_at, 'breakdown', q.breakdown,
    'frequency', COALESCE(q.frequency, 'one_time'),
    'frequency_discount_percent', COALESCE(q.frequency_discount_percent, 0),
    'businesses', jsonb_build_object('name', b.name, 'logo_url', b.logo_url)
  );
END; $function$;

-- 5. New RPC: customer picks a frequency; recomputes discount + total
CREATE OR REPLACE FUNCTION public.customer_update_call_quote_frequency(p_token text, p_frequency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  q public.call_quotes%ROWTYPE;
  r public.pricing_rules%ROWTYPE;
  v_freq_pct numeric := 0;
  v_tier_disc_pct numeric := 0;
  v_base numeric; v_addons numeric; v_mult numeric;
  v_min_job numeric;
  v_subtotal numeric; v_discount numeric; v_total numeric;
  v_freq_discounts jsonb;
BEGIN
  IF p_frequency NOT IN ('one_time','weekly','biweekly','monthly') THEN
    RAISE EXCEPTION 'invalid frequency';
  END IF;
  SELECT * INTO q FROM public.call_quotes WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
  IF NOT q.allow_customer_edits THEN RAISE EXCEPTION 'Edits disabled'; END IF;
  IF q.status = 'paid' THEN RAISE EXCEPTION 'Already paid'; END IF;
  IF q.expires_at IS NOT NULL AND q.expires_at < now() THEN RAISE EXCEPTION 'Quote expired'; END IF;

  SELECT * INTO r FROM public.pricing_rules WHERE business_id = q.business_id;
  v_freq_discounts := COALESCE(r.frequency_discounts,
    '{"one_time":0,"weekly":15,"biweekly":10,"monthly":5}'::jsonb);
  v_freq_pct := COALESCE((v_freq_discounts->>p_frequency)::numeric, 0);
  v_min_job := COALESCE(r.min_job_price, 120);

  -- Rebuild subtotal from breakdown when available, else from current subtotal
  v_base := COALESCE((q.breakdown->>'base')::numeric, 0);
  v_addons := COALESCE((q.breakdown->>'addons_cost')::numeric, 0);
  v_mult := COALESCE((q.breakdown->>'tier_multiplier')::numeric, 1);
  v_tier_disc_pct := COALESCE((q.breakdown->>'discount_pct')::numeric, 0);

  IF v_base = 0 AND v_addons = 0 THEN
    v_subtotal := COALESCE(q.subtotal, q.total);
  ELSE
    v_subtotal := (v_base + v_addons) * v_mult;
  END IF;

  v_discount := v_subtotal * (v_tier_disc_pct + v_freq_pct) / 100.0;
  v_total := GREATEST(v_min_job, v_subtotal - v_discount);

  UPDATE public.call_quotes
  SET frequency = p_frequency,
      frequency_discount_percent = v_freq_pct,
      subtotal = v_subtotal,
      discount_amount = v_discount,
      total = v_total,
      breakdown = COALESCE(breakdown,'{}'::jsonb)
        || jsonb_build_object('frequency', p_frequency, 'frequency_discount_pct', v_freq_pct)
  WHERE id = q.id;

  PERFORM public._log_call_quote_event(q.id, 'frequency_selected',
    jsonb_build_object('frequency', p_frequency, 'discount_pct', v_freq_pct, 'total', v_total));

  RETURN public.get_call_quote_by_token(p_token);
END; $function$;

-- 6. Conflict prevention: block overlapping jobs for the same technician
CREATE OR REPLACE FUNCTION public.prevent_job_overlap()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_conflict_id uuid;
BEGIN
  IF NEW.status IN ('cancelled','completed') THEN RETURN NEW; END IF;
  IF NEW.scheduled_start IS NULL OR NEW.scheduled_end IS NULL THEN RETURN NEW; END IF;
  IF NEW.assigned_team_member_id IS NULL AND (NEW.assigned_to IS NULL OR NEW.assigned_to = '') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_conflict_id
  FROM public.jobs
  WHERE business_id = NEW.business_id
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status NOT IN ('cancelled','completed')
    AND scheduled_start IS NOT NULL AND scheduled_end IS NOT NULL
    AND (
      (NEW.assigned_team_member_id IS NOT NULL AND assigned_team_member_id = NEW.assigned_team_member_id)
      OR (NEW.assigned_to IS NOT NULL AND NEW.assigned_to <> '' AND assigned_to = NEW.assigned_to)
    )
    AND tstzrange(scheduled_start, scheduled_end, '[)') && tstzrange(NEW.scheduled_start, NEW.scheduled_end, '[)')
  LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    RAISE EXCEPTION 'Scheduling conflict: this technician is already booked during that time (job %)', v_conflict_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_prevent_job_overlap ON public.jobs;
CREATE TRIGGER trg_prevent_job_overlap
  BEFORE INSERT OR UPDATE OF scheduled_start, scheduled_end, assigned_team_member_id, assigned_to, status
  ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_job_overlap();

-- 7. Duplicate customer prevention: unique per business by lower(email) / phone (when present)
CREATE UNIQUE INDEX IF NOT EXISTS customers_business_email_unique
  ON public.customers (business_id, lower(email))
  WHERE email IS NOT NULL AND email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS customers_business_phone_unique
  ON public.customers (business_id, phone)
  WHERE phone IS NOT NULL AND phone <> '';
