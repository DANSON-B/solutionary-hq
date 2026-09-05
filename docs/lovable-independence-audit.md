# Lovable Independence Audit

This document tracks the migration goal: Lovable may remain a development tool, but Solutionary HQ production should run from owner-controlled infrastructure.

## Target Ownership

- GitHub: source-code repository and backup
- Vercel: web app and PWA hosting
- Supabase: database, auth, backend services, Edge Functions, and optionally storage
- Cloud storage: owner-controlled storage for uploads and generated assets
- Lovable: development and AI coding assistance only

## Current Runtime Dependencies

### Supabase

- Frontend client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Supabase project config currently points to project id `fyoczxoniqvokqfjiink`.
- Supabase migrations define database schema, RLS policies, triggers, RPCs, and storage buckets.
- Supabase Edge Functions provide backend behavior for billing, email, SMS/voice, AI, booking, invoices, tenant sites, and webhooks.

### Storage

- Current upload storage uses Supabase Storage.
- Buckets found in migrations:
  - `job-photos`
  - `business-assets`
- Current frontend upload/read paths use `supabase.storage.from(...)`.

### Lovable

- `src/integrations/lovable/index.ts` uses `@lovable.dev/cloud-auth-js` and `https://oauth.lovable.app/initiate` for Google OAuth.
- `supabase/functions/ai-estimator/index.ts` uses `LOVABLE_API_KEY` and Lovable AI Gateway.
- `supabase/functions/generate-tenant-site/index.ts` uses `LOVABLE_API_KEY` and Lovable AI Gateway.
- `supabase/functions/send-call-quote/index.ts` can use Lovable connector gateway for Resend and Twilio when `LOVABLE_API_KEY` is configured.
- `lovable-tagger` is dev-only in Vite development mode and is not required for production runtime.
- `.lovable/` contains planning docs only.

### Other External Services

- Stripe: subscriptions, checkout, invoice payments, and webhook processing.
- Resend: transactional and marketing email.
- Twilio: SMS, calls, voicemail, and phone-number features.
- Gemini API: voicemail analysis.
- Map/CDN services: Leaflet CDN, OpenStreetMap Nominatim, ArcGIS tiles, and Carto tiles.

## Current Environment Variables

### Frontend / Vercel

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Supabase Edge Functions

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
- `LOVABLE_API_KEY` currently used by Lovable-dependent functions and should be removed from production requirements.

## Known Migration Risks

- Google sign-in currently goes through Lovable OAuth and should move to native Supabase OAuth.
- AI estimator and tenant site generation currently depend on Lovable AI Gateway.
- `send-call-quote` has fallback paths that may use Lovable connector gateway.
- `make-call` hardcodes a Supabase Functions host and must be parameterized before changing Supabase projects.
- Production CORS currently always allows Lovable preview origins; this is useful for Lovable previews but should not be required for production.
- Tests could not run during initial audit because dependencies were not installed locally.

## Phased Migration Plan

1. Source-control safety: initialize Git, verify ignored secrets, document current dependencies, then connect to owner GitHub.
2. Baseline install and verification: install dependencies, run tests, run production build, and fix existing baseline issues before migration edits.
3. Supabase ownership: confirm or create owner Supabase project, migrate schema/functions/storage, and configure secrets under the owner account.
4. Remove production Lovable auth dependency: replace Lovable OAuth with native Supabase OAuth.
5. Remove Lovable AI/connector dependencies: move AI, email, and SMS calls to owner-controlled provider APIs.
6. Vercel ownership: connect GitHub repo to owner Vercel project and configure frontend env vars.
7. Storage ownership decision: keep Supabase Storage under owner Supabase or migrate uploads to owner cloud storage such as Cloudflare R2 or AWS S3.
8. Final validation: test auth, PWA, offline queue, booking, billing, email, SMS/voice, storage uploads, and Edge Functions before marking migration complete.

## Phase 2 Baseline Verification

- Dependencies installed with `npm install --legacy-peer-deps`.
- Tests pass: `npm run test` completed with 2 test files and 6 tests passing.
- Production build passes: `npm run build` completed successfully and generated the PWA service worker.
- Build warning: Browserslist/caniuse-lite data is stale. This is non-blocking.
- Production dependency audit: `npm audit --omit=dev` reports 0 vulnerabilities.
- Full dependency audit reports dev-only vulnerabilities. Do not run automatic forced fixes without reviewing breaking changes.
- Removed `bun.lock` because Bun is not installed, npm is the documented install/deploy path, and the Bun lockfile contained Lovable sandbox package-cache URLs.
- Regenerated `package-lock.json` from the public npm registry so npm installs are no longer tied to Lovable's package cache.

## Phase 3 Supabase Portability Prep

- Added `docs/supabase-ownership-checklist.md` for the owner-controlled Supabase setup and cutover process.
- Replaced hardcoded Supabase Function callback host in `supabase/functions/make-call/index.ts` with a value derived from `SUPABASE_URL`.
- Replaced hardcoded Supabase Function callback URL in `supabase/functions/voicemail/index.ts` with a value derived from `SUPABASE_URL`.
- Remaining planned Supabase ownership step: update `supabase/config.toml` to the owner project id when the new owner-controlled Supabase project is ready.
