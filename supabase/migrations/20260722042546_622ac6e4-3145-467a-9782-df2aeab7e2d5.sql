GRANT INSERT ON public.cleaning_booking_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.cleaning_booking_requests TO authenticated;
GRANT ALL ON public.cleaning_booking_requests TO service_role;