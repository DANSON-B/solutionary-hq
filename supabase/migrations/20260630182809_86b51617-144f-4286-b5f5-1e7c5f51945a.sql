
CREATE OR REPLACE FUNCTION public.get_pricing_rules_for_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
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
      'discount_by_tier', '{"basic":0,"standard":0,"deep":0}'::jsonb
    );
  END IF;
  RETURN jsonb_build_object(
    'min_job_price', r.min_job_price,
    'tier_multipliers', r.tier_multipliers,
    'room_prices', r.room_prices,
    'sqft_tier_prices', r.sqft_tier_prices,
    'discount_by_tier', r.discount_by_tier
  );
END; $function$;

CREATE OR REPLACE FUNCTION public.customer_update_call_quote_config(p_token text, p_config jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  q public.call_quotes%ROWTYPE;
  r public.pricing_rules%ROWTYPE;
  v_tier text; v_sqft text;
  v_bed int; v_bath int; v_kit int; v_liv int; v_din int; v_off int; v_bas int; v_lau int;
  v_dep int;
  included_ids text[];
  rp jsonb; v_mult numeric; v_disc_pct numeric;
  v_base_rooms numeric := 0; v_base_sqft numeric := 0; v_base numeric := 0;
  v_addon_total numeric := 0; v_new_addons jsonb := '[]'::jsonb;
  a jsonb; is_req boolean; is_inc boolean; aid text;
  v_subtotal numeric; v_discount numeric; v_total numeric;
  v_min_job numeric;
BEGIN
  SELECT * INTO q FROM public.call_quotes WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
  IF NOT q.allow_customer_edits THEN RAISE EXCEPTION 'Edits disabled'; END IF;
  IF q.status = 'paid' THEN RAISE EXCEPTION 'Already paid'; END IF;
  IF q.expires_at IS NOT NULL AND q.expires_at < now() THEN RAISE EXCEPTION 'Quote expired'; END IF;

  SELECT * INTO r FROM public.pricing_rules WHERE business_id = q.business_id;
  IF NOT FOUND THEN
    INSERT INTO public.pricing_rules (business_id) VALUES (q.business_id) RETURNING * INTO r;
  END IF;
  v_min_job := r.min_job_price;

  v_tier := COALESCE(p_config->>'service_tier', q.service_tier, 'standard');
  IF v_tier NOT IN ('basic','standard','deep') THEN v_tier := 'standard'; END IF;
  v_sqft := COALESCE(p_config->>'sqft_tier', q.sqft_tier);
  v_bed := GREATEST(0, COALESCE((p_config->>'bedrooms')::int, q.bedrooms));
  v_bath := GREATEST(0, COALESCE((p_config->>'bathrooms')::int, q.bathrooms));
  v_kit := GREATEST(0, COALESCE((p_config->>'kitchens')::int, q.kitchens));
  v_liv := GREATEST(0, COALESCE((p_config->>'living_rooms')::int, q.living_rooms));
  v_din := GREATEST(0, COALESCE((p_config->>'dining_rooms')::int, q.dining_rooms));
  v_off := GREATEST(0, COALESCE((p_config->>'offices')::int, q.offices));
  v_bas := GREATEST(0, COALESCE((p_config->>'finished_basement')::int, q.finished_basement));
  v_lau := GREATEST(0, COALESCE((p_config->>'laundry_room')::int, q.laundry_room));
  v_dep := COALESCE((p_config->>'deposit_percent')::int, q.deposit_percent);
  IF v_dep NOT IN (25,50,100) THEN v_dep := 50; END IF;

  rp := r.room_prices;
  v_base_rooms :=
      v_bed * COALESCE((rp->>'bedrooms')::numeric,0)
    + v_bath * COALESCE((rp->>'bathrooms')::numeric,0)
    + v_kit * COALESCE((rp->>'kitchens')::numeric,0)
    + v_liv * COALESCE((rp->>'living_rooms')::numeric,0)
    + v_din * COALESCE((rp->>'dining_rooms')::numeric,0)
    + v_off * COALESCE((rp->>'offices')::numeric,0)
    + v_bas * COALESCE((rp->>'finished_basement')::numeric,0)
    + v_lau * COALESCE((rp->>'laundry_room')::numeric,0);
  IF v_sqft IS NOT NULL THEN
    v_base_sqft := COALESCE((r.sqft_tier_prices->>v_sqft)::numeric, 0);
  END IF;
  v_base := GREATEST(v_base_rooms, v_base_sqft);

  IF p_config ? 'included_addon_ids' THEN
    SELECT array_agg(value::text) INTO included_ids FROM jsonb_array_elements_text(p_config->'included_addon_ids');
  ELSE
    SELECT array_agg(value->>'id') INTO included_ids
    FROM jsonb_array_elements(COALESCE(q.addons,'[]'::jsonb)) value
    WHERE COALESCE((value->>'included')::boolean, true);
  END IF;
  included_ids := COALESCE(included_ids, ARRAY[]::text[]);

  FOR a IN SELECT * FROM jsonb_array_elements(COALESCE(q.addons,'[]'::jsonb))
  LOOP
    aid := a->>'id';
    is_req := COALESCE((a->>'required')::boolean, false);
    is_inc := is_req OR (aid = ANY(included_ids));
    v_new_addons := v_new_addons || jsonb_build_array(
      jsonb_set(jsonb_set(a,'{required}',to_jsonb(is_req)),'{included}',to_jsonb(is_inc))
    );
    IF is_inc THEN v_addon_total := v_addon_total + COALESCE((a->>'price')::numeric, 0); END IF;
  END LOOP;

  v_mult := COALESCE((r.tier_multipliers->>v_tier)::numeric, 1);
  v_disc_pct := COALESCE((r.discount_by_tier->>v_tier)::numeric, 0);
  v_subtotal := (v_base + v_addon_total) * v_mult;
  v_discount := v_subtotal * v_disc_pct / 100.0;
  v_total := GREATEST(v_min_job, v_subtotal - v_discount);

  UPDATE public.call_quotes
  SET service_tier = v_tier, sqft_tier = v_sqft,
      bedrooms = v_bed, bathrooms = v_bath, kitchens = v_kit, living_rooms = v_liv,
      dining_rooms = v_din, offices = v_off, finished_basement = v_bas, laundry_room = v_lau,
      addons = v_new_addons,
      subtotal = v_subtotal,
      discount_amount = v_discount,
      total = v_total,
      deposit_percent = v_dep,
      breakdown = jsonb_build_object(
        'base', v_base, 'base_rooms', v_base_rooms, 'base_sqft', v_base_sqft,
        'addons_cost', v_addon_total, 'tier_multiplier', v_mult, 'discount_pct', v_disc_pct,
        'min_job_price', v_min_job,
        'service_label', q.breakdown->>'service_label'
      )
  WHERE id = q.id;

  PERFORM public._log_call_quote_event(q.id, 'config_updated', jsonb_build_object(
    'service_tier', v_tier, 'sqft_tier', v_sqft, 'total', v_total, 'deposit_percent', v_dep
  ));

  RETURN public.get_call_quote_by_token(p_token);
END; $function$;
