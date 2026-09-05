CREATE OR REPLACE FUNCTION public.is_public_booking_quote(_quote_id uuid)
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
      AND public.is_public_booking_business(q.business_id)
  )
$$;

DROP POLICY IF EXISTS "Public can insert quote items via InstaQuote" ON public.quote_items;
CREATE POLICY "Public can insert quote items via InstaQuote"
ON public.quote_items
FOR INSERT
TO anon, authenticated
WITH CHECK (public.is_public_booking_quote(quote_id));