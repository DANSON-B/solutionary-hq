-- Confirm the demo account's email
UPDATE auth.users
SET email_confirmed_at = now()
WHERE id = '46679235-2c97-497e-88d8-c87246e4fc90';

-- Create a demo business owned by the demo user
INSERT INTO public.businesses (id, owner_id, name, industry, email, phone, address, city, state, zip, slug, website)
VALUES (
  gen_random_uuid(),
  '46679235-2c97-497e-88d8-c87246e4fc90',
  'Demo Cleaning Co.',
  'cleaning',
  'demo@solutionaryhq.com',
  '(555) 123-4567',
  '123 Demo Street',
  'Demo City',
  'CA',
  '90210',
  'demo-cleaning',
  'https://www.solutionaryhq.com'
)
ON CONFLICT DO NOTHING;

-- Link the profile to the business
UPDATE public.profiles
SET business_id = (SELECT id FROM public.businesses WHERE owner_id = '46679235-2c97-497e-88d8-c87246e4fc90' LIMIT 1)
WHERE user_id = '46679235-2c97-497e-88d8-c87246e4fc90';

-- Grant subscription override (bypass Stripe paywall)
INSERT INTO public.subscription_overrides (user_id, reason)
VALUES ('46679235-2c97-497e-88d8-c87246e4fc90', 'Demo/test account — full feature access')
ON CONFLICT DO NOTHING;