# Google OAuth Setup For Supabase

Use this guide to make Google sign-in independent from Lovable. The app already calls native Supabase OAuth from `src/pages/LoginPage.tsx`; the remaining work is account configuration.

## What You Need

- Access to the owner Google account or Google Cloud organization.
- Access to the owner Supabase project.
- The production app domain, for example `https://solutionaryhq.com`.
- The Supabase project URL, for example `https://your-project-ref.supabase.co`.

## Google Cloud Steps

1. Go to Google Cloud Console.
2. Create or select the owner-controlled project for Solutionary HQ.
3. Open APIs & Services > OAuth consent screen.
4. Configure the app name as `Solutionary HQ`.
5. Add the owner support email.
6. Add authorized domains:
   - `solutionaryhq.com`
   - `supabase.co`
7. Open APIs & Services > Credentials.
8. Create OAuth client ID.
9. Choose Web application.
10. Add Authorized JavaScript origins:
   - `https://solutionaryhq.com`
   - `https://www.solutionaryhq.com` if used
   - `http://localhost:8080` for local development
   - Any Vercel preview domain you want to test with
11. Add Authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
12. Save the OAuth client.
13. Copy the Google Client ID and Client Secret into the owner password manager.

## Supabase Steps

1. Open the owner Supabase project.
2. Go to Authentication > Providers.
3. Enable Google.
4. Paste the Google Client ID.
5. Paste the Google Client Secret.
6. Save the provider settings.
7. Go to Authentication > URL Configuration.
8. Set Site URL:
   - `https://solutionaryhq.com`
9. Add Redirect URLs:
   - `https://solutionaryhq.com`
   - `https://www.solutionaryhq.com` if used
   - `http://localhost:8080`
   - Vercel preview URLs if used

## Vercel / Frontend Env

Make sure Vercel uses the same owner Supabase project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Validation

1. Run the app locally with `npm run dev`.
2. Open `http://localhost:8080/login`.
3. Click Sign in with Google.
4. Confirm Google redirects to Supabase and then back to the app.
5. Confirm the app routes the signed-in user to onboarding, choose-plan, or dashboard.
6. Repeat from a Vercel preview before production cutover.

## Notes

- Do not put the Google Client Secret in `.env` or Vercel frontend variables.
- The Google Client Secret belongs only in Supabase Auth provider settings.
- If sign-in fails with a redirect error, check both places: Google Authorized redirect URIs and Supabase Redirect URLs.
- If using a new Supabase project later, the Google redirect URI must be updated to the new project callback URL.
