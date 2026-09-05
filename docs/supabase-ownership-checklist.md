# Supabase Ownership Checklist

Use this checklist when moving Solutionary HQ to a Supabase project controlled by the owner account.

## Project

- Create or confirm the owner-controlled Supabase project.
- Record the new project ref, API URL, anon/publishable key, and service role key in the owner password manager.
- Update `supabase/config.toml` to the owner project id only when ready to deploy against the new project.
- Update Vercel frontend env vars to use the owner project:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`

## Database

- Apply all migrations in `supabase/migrations` to the owner Supabase project.
- Verify required extensions from migrations are enabled, especially `pg_net`, `pg_cron`, and `supabase_vault` where available.
- Verify RLS is enabled on application tables and storage policies are present.
- If migrating existing production data, export data from the old project and import into the owner project before switching frontend env vars.

## Auth

- Follow `docs/google-supabase-oauth-setup.md` for Google OAuth setup.
- Configure Site URL in Supabase Auth settings to the production domain.
- Configure redirect URLs for local development, Vercel preview domains if needed, and production domains.
- Configure Google OAuth directly in Supabase because the app now uses native Supabase OAuth instead of Lovable OAuth.
- Google OAuth redirect/callback must be configured in Google Cloud and Supabase Auth provider settings for the owner Supabase project.
- At minimum, allow local and production redirects used by the app, such as `http://localhost:8080`, the Vercel preview domain if used, and the production domain.
- Verify password signup, login, logout, password reset, and Google OAuth in a staging deployment before production cutover.

## Storage

- Create or verify buckets from migrations:
  - `job-photos`
  - `business-assets`
- Confirm public/private settings match the current app behavior.
- Test logo upload, job photo upload, signed URL reads, public URL reads, and delete behavior.
- Decide later whether to keep Supabase Storage under the owner account or migrate files to Cloudflare R2/AWS S3.

## Edge Functions

- Deploy all functions in `supabase/functions` to the owner project.
- Configure Supabase function settings from `supabase/config.toml`, including functions with `verify_jwt = false` for webhooks/public entry points.
- Set Edge Function secrets in Supabase:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SITE_URL`
  - `ALLOWED_ORIGINS`
  - `ALLOWED_STRIPE_PRICE_IDS`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_API_KEY`
  - `TWILIO_FROM_NUMBER`
  - `GEMINI_API_KEY`
- Do not rely on `LOVABLE_API_KEY` for production after the Lovable AI/connector migration phase.

## Webhooks

- Update Stripe webhooks to point to the owner Supabase project function URL.
- Update Twilio voice/SMS webhook URLs to point to the owner Supabase project function URLs.
- Verify webhook signature secrets/tokens match the owner Stripe/Twilio accounts.
- Test webhook flows before switching the production frontend to the new backend.

## Cutover Validation

- Run `npm run test` and `npm run build` locally before deployment.
- Deploy a Vercel preview connected to the owner Supabase project.
- Smoke test auth, dashboard load, booking request, quote/invoice payment path, email send, SMS/voice if configured, logo upload, job photo upload, PWA install, and offline queue sync.
- Switch production only after staging/preview validation passes.
