-- Allow public embedded forms to validate a public booking business without relying on caller-visible business rows
CREATE OR REPLACE FUNCTION public.is_public_booking_business(_business_id uuid)
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

-- Customers created from public booking / quote forms
DROP POLICY IF EXISTS "Public can insert customers via booking" ON public.customers;
DROP POLICY IF EXISTS "Anon can insert customers via InstaQuote" ON public.customers;
CREATE POLICY "Public can insert customers via booking"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_public_booking_business(business_id));

-- Quotes created from public InstaQuote forms
DROP POLICY IF EXISTS "Anon can insert quotes via InstaQuote" ON public.quotes;
CREATE POLICY "Public can insert quotes via InstaQuote"
ON public.quotes
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_public_booking_business(business_id));

-- Quote items created after the public quote record is created
DROP POLICY IF EXISTS "Anon can insert quote items via InstaQuote" ON public.quote_items;
CREATE POLICY "Public can insert quote items via InstaQuote"
ON public.quote_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.quotes q
    WHERE q.id = quote_id
      AND public.is_public_booking_business(q.business_id)
  )
);

-- Cleaning booking wizard requests from embedded/public forms
DROP POLICY IF EXISTS "Anon can submit booking requests" ON public.cleaning_booking_requests;
CREATE POLICY "Public can submit booking requests"
ON public.cleaning_booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_public_booking_business(business_id));

-- Gift card purchases from embedded/public forms
DROP POLICY IF EXISTS "Anon can purchase gift cards" ON public.cleaning_gift_cards;
CREATE POLICY "Public can purchase gift cards"
ON public.cleaning_gift_cards
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_public_booking_business(business_id));