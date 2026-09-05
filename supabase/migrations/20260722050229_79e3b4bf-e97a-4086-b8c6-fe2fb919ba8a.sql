GRANT INSERT ON public.cleaning_booking_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.cleaning_booking_requests TO authenticated;
GRANT ALL ON public.cleaning_booking_requests TO service_role;

GRANT INSERT ON public.customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

DROP POLICY IF EXISTS "Public can submit booking requests" ON public.cleaning_booking_requests;
CREATE POLICY "Public can submit booking requests"
ON public.cleaning_booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (private.is_public_booking_business(business_id));

DROP POLICY IF EXISTS "Public can insert customers via booking" ON public.customers;
CREATE POLICY "Public can insert customers via booking"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (private.is_public_booking_business(business_id));