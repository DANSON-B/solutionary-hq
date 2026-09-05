
-- Add slug to businesses for public InstaQuote URLs
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index on slug
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- Allow public read of business info by slug (for InstaQuote)
CREATE POLICY "Public can view businesses by slug"
ON public.businesses
FOR SELECT
TO anon
USING (slug IS NOT NULL);

-- Allow public read of active services for a business (for InstaQuote)
CREATE POLICY "Public can view active services"
ON public.services
FOR SELECT
TO anon
USING (is_active = true);

-- Allow anon to insert customers (for InstaQuote lead capture)
CREATE POLICY "Anon can insert customers via InstaQuote"
ON public.customers
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to insert quotes (for InstaQuote)
CREATE POLICY "Anon can insert quotes via InstaQuote"
ON public.quotes
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to insert quote items (for InstaQuote)
CREATE POLICY "Anon can insert quote items via InstaQuote"
ON public.quote_items
FOR INSERT
TO anon
WITH CHECK (true);
