
# AI Websites for Every Business (Sites HQ)

Give each Solutionary HQ tenant a full AI-generated marketing site at `solutionaryhq.com/site/:slug` — home, services, about, contact, book, reviews, city×service pages, and industry blog — auto-written on business setup and editable from the dashboard. Zero changes to existing routes, RLS, or booking flow.

## What ships

### 1. New public routes (all React + react-helmet-async)
```
/site/:slug                          Home (hero, services, reviews, CTA)
/site/:slug/services                 Services list
/site/:slug/services/:serviceSlug    Service detail
/site/:slug/about                    About + team + trust badges
/site/:slug/contact                  Contact + hours + map
/site/:slug/book                     Embeds existing CleaningBookingWizard
/site/:slug/reviews                  Pulls reviews table + Review schema
/site/:slug/blog                     Article index
/site/:slug/blog/:postSlug           Article detail
/site/:slug/areas/:city/:service     Programmatic city×service page
```
Layout shared via `TenantSiteLayout` (nav, footer, brand color, logo). Uses the QuoteIQ-inspired design system already in place (cream bg, navy/amber, Archivo Narrow).

### 2. Database (one migration, new tables only — no changes to existing)
```
tenant_sites             one row per business: theme, tagline, hero_headline,
                         hero_subheadline, about_text, cta_text, published,
                         primary_color, hero_image_url, generated_at
tenant_site_services     service cards (title, slug, description, price_from, icon)
tenant_site_areas        cities served (city, state, lat, lng)
tenant_blog_posts        AI-generated articles (slug, title, excerpt, body_md, cover_url, published)
tenant_site_faqs         FAQ items for FAQPage schema
```
All with `business_id` FK, RLS: owner writes, public reads only when `tenant_sites.published = true`. Public reads exposed via `get_tenant_site_bundle(slug)` security-definer RPC (single call = full site payload).

### 3. Edge function: `generate-tenant-site`
- Auth: JWT-verified, owner-only
- Uses **Lovable AI Gateway** (`google/gemini-2.5-flash` for copy, `google/gemini-3.1-flash-image` for hero) — no user key needed
- Prompts industry-aware (cleaning, HVAC, plumbing, electrical, etc.)
- Generates: tagline, hero copy, 4–8 services with descriptions, about paragraph, 5 FAQs, 3 seed blog posts, hero image
- Writes to the 5 new tables in one transaction
- Idempotent: `regenerate=true` overwrites; otherwise no-op if already generated

### 4. Dashboard editor: `/dashboard/website`
- "Generate My Website" primary CTA (calls edge function, shows progress)
- Live preview iframe of `/site/:slug`
- Inline edit for every section (hero, services, about, FAQs, blog posts, service areas)
- Publish toggle
- Copy-embed snippet + "Open live site" button
- City manager (add cities → auto-creates area pages)

### 5. SEO (per route, via react-helmet-async)
- `<title>`, meta description, canonical, OG/Twitter tags — unique per page
- JSON-LD schemas:
  - Home: `LocalBusiness` + `Organization`
  - Services: `Service`
  - Reviews: `AggregateRating` + `Review`
  - Blog post: `Article` + `BreadcrumbList`
  - FAQ section: `FAQPage`
  - City page: `LocalBusiness` scoped to city
- Per-tenant sitemap served by edge function `tenant-sitemap` at `/site/:slug/sitemap.xml`
- Root `sitemap.xml` generator updated to include every published tenant's site URL
- `robots.txt` unchanged (already permissive)

### 6. Safety rails (no regressions)
- All new routes added below existing route table in `App.tsx` — nothing existing moves
- New tables only; zero schema change to `businesses`, `customers`, `cleaning_booking_requests`, etc.
- `/site/:slug/book` reuses `CleaningBookingWizard` unchanged
- Type-check + Playwright smoke test on `/site/<existing-slug>` before hand-off

## Technical details

**Files created**
```
supabase/migrations/<ts>_tenant_sites.sql
supabase/functions/generate-tenant-site/index.ts
supabase/functions/tenant-sitemap/index.ts
src/pages/site/TenantSiteLayout.tsx
src/pages/site/TenantHomePage.tsx
src/pages/site/TenantServicesPage.tsx
src/pages/site/TenantServiceDetailPage.tsx
src/pages/site/TenantAboutPage.tsx
src/pages/site/TenantContactPage.tsx
src/pages/site/TenantBookPage.tsx
src/pages/site/TenantReviewsPage.tsx
src/pages/site/TenantBlogPage.tsx
src/pages/site/TenantBlogPostPage.tsx
src/pages/site/TenantAreaPage.tsx
src/pages/dashboard/WebsiteBuilderPage.tsx
src/components/site/TenantSeo.tsx
src/components/site/TenantSchema.tsx
src/hooks/useTenantSite.ts
```

**Files edited (append-only)**
```
src/App.tsx                    add /site/* routes + /dashboard/website route
src/components/dashboard/DashboardSidebar.tsx   add "Website" nav item
scripts/generate-sitemap.ts    include tenant site URLs
```

**No files deleted, no existing files rewritten.**

## Rollout order in one build pass
1. Migration (tables + RLS + `get_tenant_site_bundle` RPC)
2. Edge functions (`generate-tenant-site`, `tenant-sitemap`)
3. Public pages + layout + SEO components
4. Dashboard editor
5. Route wiring + sidebar link
6. Type-check → Playwright smoke → done

Approve and I'll build it end-to-end in one pass.
