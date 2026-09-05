
-- Gift card packages (predefined by admin)
CREATE TABLE public.cleaning_gift_card_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cleaning_type TEXT NOT NULL DEFAULT 'quick_refresh',
  rooms_included TEXT[] DEFAULT '{}',
  max_rooms INTEGER NOT NULL DEFAULT 2,
  max_sqft INTEGER NOT NULL DEFAULT 1500,
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 90,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gift card purchases and redemptions
CREATE TABLE public.cleaning_gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.cleaning_gift_card_packages(id),
  code TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(8), 'hex'),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_message TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  cleaning_type TEXT NOT NULL DEFAULT 'quick_refresh',
  rooms_included TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_customer_id UUID REFERENCES public.customers(id),
  job_id UUID REFERENCES public.jobs(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 year'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code)
);

-- Booking requests table for all service categories
CREATE TABLE public.cleaning_booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'residential',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  property_sqft INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  cleaning_type TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  extras TEXT[] DEFAULT '{}',
  notes TEXT,
  estimated_total NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  lead_score INTEGER DEFAULT 0,
  is_high_value BOOLEAN DEFAULT false,
  gift_card_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for gift card packages
ALTER TABLE public.cleaning_gift_card_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owners can manage gift card packages" ON public.cleaning_gift_card_packages FOR ALL TO authenticated USING (is_business_owner(business_id)) WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Anon can view active gift card packages" ON public.cleaning_gift_card_packages FOR SELECT TO anon USING (is_active = true);

-- RLS for gift cards
ALTER TABLE public.cleaning_gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owners can manage gift cards" ON public.cleaning_gift_cards FOR ALL TO authenticated USING (is_business_owner(business_id)) WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Anon can purchase gift cards" ON public.cleaning_gift_cards FOR INSERT TO anon WITH CHECK (business_id IN (SELECT id FROM businesses WHERE slug IS NOT NULL));
CREATE POLICY "Anon can view gift card by code" ON public.cleaning_gift_cards FOR SELECT TO anon USING (status = 'active' AND expires_at > now());

-- RLS for booking requests
ALTER TABLE public.cleaning_booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owners can manage booking requests" ON public.cleaning_booking_requests FOR ALL TO authenticated USING (is_business_owner(business_id)) WITH CHECK (is_business_owner(business_id));
CREATE POLICY "Anon can submit booking requests" ON public.cleaning_booking_requests FOR INSERT TO anon WITH CHECK (business_id IN (SELECT id FROM businesses WHERE slug IS NOT NULL));
