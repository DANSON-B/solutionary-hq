-- 1. Remove client-controlled public inserts
DROP POLICY IF EXISTS "Public can submit booking requests" ON public.cleaning_booking_requests;
DROP POLICY IF EXISTS "Public can purchase gift cards" ON public.cleaning_gift_cards;

-- Keep dashboard functionality for owners/team members
CREATE POLICY "Business members can create booking requests"
  ON public.cleaning_booking_requests FOR INSERT TO authenticated
  WITH CHECK (private.is_business_member(business_id));

CREATE POLICY "Business members can create gift cards"
  ON public.cleaning_gift_cards FOR INSERT TO authenticated
  WITH CHECK (private.is_business_member(business_id));

-- 2. Validated public booking submission
CREATE OR REPLACE FUNCTION public.submit_public_booking_request(p_business_id uuid, p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text := lower(trim(coalesce(p_payload->>'email', '')));
  v_name text := trim(coalesce(p_payload->>'name', ''));
BEGIN
  IF NOT private.is_public_booking_business(p_business_id) THEN
    RAISE EXCEPTION 'Business not available for public booking';
  END IF;
  IF v_name = '' OR v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Valid name and email are required';
  END IF;

  INSERT INTO public.cleaning_booking_requests (
    business_id, category, name, email, phone, address, city, state, zip,
    property_sqft, bedrooms, bathrooms, cleaning_type, preferred_date, preferred_time,
    extras, notes, estimated_total, lead_score, is_high_value,
    status, amount_paid, deposit_percent, gift_card_code, stripe_session_id
  ) VALUES (
    p_business_id,
    coalesce(nullif(left(p_payload->>'category', 40), ''), 'residential'),
    left(v_name, 160),
    left(v_email, 255),
    nullif(left(coalesce(p_payload->>'phone', ''), 40), ''),
    nullif(left(coalesce(p_payload->>'address', ''), 300), ''),
    nullif(left(coalesce(p_payload->>'city', ''), 120), ''),
    nullif(left(coalesce(p_payload->>'state', ''), 40), ''),
    nullif(left(coalesce(p_payload->>'zip', ''), 20), ''),
    nullif(p_payload->>'property_sqft', '')::int,
    nullif(p_payload->>'bedrooms', '')::int,
    nullif(p_payload->>'bathrooms', '')::int,
    nullif(left(coalesce(p_payload->>'cleaning_type', ''), 120), ''),
    nullif(p_payload->>'preferred_date', '')::date,
    nullif(left(coalesce(p_payload->>'preferred_time', ''), 40), ''),
    coalesce(
      (SELECT array_agg(left(x, 120)) FROM jsonb_array_elements_text(coalesce(p_payload->'extras', '[]'::jsonb)) AS t(x)),
      '{}'::text[]
    ),
    nullif(left(coalesce(p_payload->>'notes', ''), 1500), ''),
    greatest(0, coalesce(nullif(p_payload->>'estimated_total', '')::numeric, 0)),
    least(100, greatest(0, coalesce(nullif(p_payload->>'lead_score', '')::int, 50))),
    coalesce((p_payload->>'is_high_value')::boolean, false),
    'new',   -- server-controlled
    0,       -- never paid at submission time
    NULL,    -- deposit set by payment flow only
    NULL,    -- gift card applied server-side only
    NULL
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_booking_request(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_booking_request(uuid, jsonb) TO anon, authenticated, service_role;

-- 3. Validated public gift card purchase (unpaid until payment confirms)
CREATE OR REPLACE FUNCTION public.request_public_gift_card(p_business_id uuid, p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_type text := coalesce(nullif(p_payload->>'cleaning_type', ''), 'quick_refresh');
  v_pkg public.cleaning_gift_card_packages%ROWTYPE;
  v_amount numeric;
  v_rooms text[];
  v_buyer_email text := lower(trim(coalesce(p_payload->>'buyer_email', '')));
BEGIN
  IF NOT private.is_public_booking_business(p_business_id) THEN
    RAISE EXCEPTION 'Business not available for public booking';
  END IF;
  IF v_buyer_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'A valid buyer email is required';
  END IF;

  SELECT * INTO v_pkg
  FROM public.cleaning_gift_card_packages
  WHERE business_id = p_business_id AND cleaning_type = v_type AND is_active = true
  ORDER BY created_at
  LIMIT 1;

  IF FOUND THEN
    v_amount := v_pkg.price;
    v_rooms := coalesce(v_pkg.rooms_included, '{}'::text[]);
  ELSE
    -- server-side fallback catalog; never trust client pricing
    v_amount := CASE v_type
      WHEN 'quick_refresh' THEN 75
      WHEN 'home_sparkle' THEN 130
      WHEN 'full_glow' THEN 199
      ELSE NULL END;
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Unknown gift card package';
    END IF;
    v_rooms := CASE v_type
      WHEN 'quick_refresh' THEN ARRAY['kitchen','bathroom','living_room']
      WHEN 'home_sparkle' THEN ARRAY['kitchen','bathroom','living_room','bedroom']
      ELSE ARRAY['kitchen','bathroom','living_room','bedroom','dining'] END;
  END IF;

  INSERT INTO public.cleaning_gift_cards (
    business_id, package_id, buyer_name, buyer_email, buyer_phone,
    recipient_name, recipient_email, recipient_message,
    amount, cleaning_type, rooms_included, status
  ) VALUES (
    p_business_id,
    v_pkg.id,
    left(trim(coalesce(p_payload->>'buyer_name', '')), 160),
    left(v_buyer_email, 255),
    nullif(left(coalesce(p_payload->>'buyer_phone', ''), 40), ''),
    nullif(left(coalesce(p_payload->>'recipient_name', ''), 160), ''),
    nullif(left(lower(coalesce(p_payload->>'recipient_email', '')), 255), ''),
    nullif(left(coalesce(p_payload->>'recipient_message', ''), 1000), ''),
    v_amount,          -- server-derived price
    v_type,
    v_rooms,
    'pending_payment'  -- not redeemable until payment is confirmed
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_public_gift_card(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_public_gift_card(uuid, jsonb) TO anon, authenticated, service_role;