DROP POLICY IF EXISTS "Anonymous users can create customers" ON public.customers;

CREATE POLICY "Anonymous users can create booking customers"
ON public.customers
FOR INSERT
TO anon
WITH CHECK (
  business_id IS NOT NULL
  AND first_name IS NOT NULL
  AND last_name IS NOT NULL
);