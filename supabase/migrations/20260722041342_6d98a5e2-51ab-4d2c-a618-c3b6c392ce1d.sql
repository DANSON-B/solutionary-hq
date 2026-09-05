
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS stripe_session_id text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deposit_percent int;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;
ALTER TABLE public.cleaning_booking_requests ADD COLUMN IF NOT EXISTS stripe_session_id text;
ALTER TABLE public.cleaning_booking_requests ADD COLUMN IF NOT EXISTS deposit_percent int;
ALTER TABLE public.cleaning_booking_requests ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;
