-- Allow public booking form to insert customers regardless of auth role,
-- as long as the target business has a public slug.
DROP POLICY IF EXISTS "Anon can insert customers via InstaQuote" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert" ON public.customers;

CREATE POLICY "Public can insert customers via booking"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  business_id IN (SELECT id FROM public.businesses WHERE slug IS NOT NULL)
);