# SolutionaryHQ Web App

Vite + React + TypeScript frontend with Supabase backend integration.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind + shadcn UI
- Supabase (auth, database, storage, edge functions)

## Local setup

1. Install dependencies:

```bash
npm install --legacy-peer-deps
```

2. Create local env file:

```bash
cp .env.example .env
```

3. Fill required values in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID` (optional, used by some features)

4. Start dev server:

```bash
npm run dev
```

## Quality checks

```bash
npm run test
npm run build
```

## Deploy to Vercel

This repo includes `vercel.json` SPA rewrites so React Router deep links resolve correctly.

1. Import the repo in Vercel.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add environment variables from `.env.example` in Vercel Project Settings.
6. Deploy.

## Google Login

Google sign-in uses native Supabase OAuth. Configure the Google provider in the owner Supabase project before relying on Google login. See `docs/google-supabase-oauth-setup.md`.

## Production Security Config

Set these Supabase Edge Function environment variables before going live:

- `SITE_URL` (for example `https://solutionaryhq.com`)
- `ALLOWED_ORIGINS` (comma-separated allowed web origins, e.g. `https://solutionaryhq.com,https://www.solutionaryhq.com`)
- `ALLOWED_STRIPE_PRICE_IDS` (comma-separated Stripe price IDs that checkout is allowed to create)

## Notes

- Do not commit `.env`; only commit `.env.example`.
- Supabase env variables are validated at runtime and the app will fail fast if missing.
