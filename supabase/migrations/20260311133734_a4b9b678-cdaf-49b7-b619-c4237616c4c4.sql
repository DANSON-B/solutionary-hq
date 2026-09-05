
-- Tighten anon insert policies to require valid business_id
DROP POLICY IF EXISTS "Anon can insert customers via InstaQuote" ON public.customers;
CREATE POLICY "Anon can insert customers via InstaQuote"
ON public.customers
FOR INSERT
TO anon
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE slug IS NOT NULL));

DROP POLICY IF EXISTS "Anon can insert quotes via InstaQuote" ON public.quotes;
CREATE POLICY "Anon can insert quotes via InstaQuote"
ON public.quotes
FOR INSERT
TO anon
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE slug IS NOT NULL));

DROP POLICY IF EXISTS "Anon can insert quote items via InstaQuote" ON public.quote_items;
CREATE POLICY "Anon can insert quote items via InstaQuote"
ON public.quote_items
FOR INSERT
TO anon
WITH CHECK (quote_id IN (SELECT id FROM public.quotes));
