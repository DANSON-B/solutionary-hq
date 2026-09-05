-- Remove duplicate payment rows that were created by repeated verification calls
-- for the same Stripe payment intent.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY invoice_id, reference
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.payments
  WHERE reference IS NOT NULL
)
DELETE FROM public.payments p
USING ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- Enforce idempotency for card payments tied to Stripe payment intents.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_invoice_reference_unique
  ON public.payments (invoice_id, reference)
  WHERE reference IS NOT NULL;

