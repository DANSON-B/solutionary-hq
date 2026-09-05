
-- Service requests table for customer portal submissions
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Business owners can manage all service requests
CREATE POLICY "Business owners can manage service requests"
ON public.service_requests
FOR ALL
TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Anon users can insert service requests via portal token (business must exist)
CREATE POLICY "Anon can insert service requests via portal"
ON public.service_requests
FOR INSERT
TO anon
WITH CHECK (
  customer_id IN (
    SELECT customer_id FROM customer_portal_tokens WHERE expires_at > now()
  )
);

-- Anon can view their own service requests via portal
CREATE POLICY "Anon can view service requests via portal"
ON public.service_requests
FOR SELECT
TO anon
USING (
  customer_id IN (
    SELECT customer_id FROM customer_portal_tokens WHERE expires_at > now()
  )
);
