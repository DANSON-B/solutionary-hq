CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_public_booking_business(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses
    WHERE id = _business_id
      AND slug IS NOT NULL
  )
$$;

CREATE OR REPLACE FUNCTION private.is_public_booking_quote(_quote_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.quotes q
    WHERE q.id = _quote_id
      AND private.is_public_booking_business(q.business_id)
  )
$$;

DROP POLICY IF EXISTS "Public can insert customers via booking" ON public.customers;
CREATE POLICY "Public can insert customers via booking"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (private.is_public_booking_business(business_id));

DROP POLICY IF EXISTS "Public can insert quotes via InstaQuote" ON public.quotes;
CREATE POLICY "Public can insert quotes via InstaQuote"
ON public.quotes
FOR INSERT
TO anon, authenticated
WITH CHECK (private.is_public_booking_business(business_id));

DROP POLICY IF EXISTS "Public can insert quote items via InstaQuote" ON public.quote_items;
CREATE POLICY "Public can insert quote items via InstaQuote"
ON public.quote_items
FOR INSERT
TO anon, authenticated
WITH CHECK (private.is_public_booking_quote(quote_id));

DROP POLICY IF EXISTS "Public can submit booking requests" ON public.cleaning_booking_requests;
CREATE POLICY "Public can submit booking requests"
ON public.cleaning_booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (private.is_public_booking_business(business_id));

DROP POLICY IF EXISTS "Public can purchase gift cards" ON public.cleaning_gift_cards;
CREATE POLICY "Public can purchase gift cards"
ON public.cleaning_gift_cards
FOR INSERT
TO anon, authenticated
WITH CHECK (private.is_public_booking_business(business_id));

DROP FUNCTION IF EXISTS public.is_public_booking_quote(uuid);
DROP FUNCTION IF EXISTS public.is_public_booking_business(uuid);