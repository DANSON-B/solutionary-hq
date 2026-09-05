
-- Add Stripe fields to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_payment_url text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Add recurring invoice support
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS recurring_interval text; -- monthly, weekly, etc.
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS next_invoice_date date;

-- Allow anon to view invoices by id (for payment page)
CREATE POLICY "Public can view invoice for payment"
ON public.invoices
FOR SELECT
TO anon
USING (stripe_payment_url IS NOT NULL);

-- Allow anon to view invoice items for payment
CREATE POLICY "Public can view invoice items for payment"
ON public.invoice_items
FOR SELECT
TO anon
USING (invoice_id IN (SELECT id FROM public.invoices WHERE stripe_payment_url IS NOT NULL));

-- Allow anon to view business info for invoice
CREATE POLICY "Public can view business for invoice"
ON public.businesses
FOR SELECT
TO anon
USING (id IN (SELECT business_id FROM public.invoices WHERE stripe_payment_url IS NOT NULL));

-- Allow anon to view customer for invoice
CREATE POLICY "Public can view customer for invoice"
ON public.customers
FOR SELECT
TO anon
USING (id IN (SELECT customer_id FROM public.invoices WHERE stripe_payment_url IS NOT NULL));
