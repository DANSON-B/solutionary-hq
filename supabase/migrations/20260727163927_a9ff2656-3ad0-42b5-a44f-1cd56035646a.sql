
-- =========================================================
-- Tenant Sites (AI-generated per-business websites)
-- =========================================================

-- 1) tenant_sites
CREATE TABLE public.tenant_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  published BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'navy-amber',
  primary_color TEXT NOT NULL DEFAULT '#0B1E3F',
  accent_color TEXT NOT NULL DEFAULT '#F5A524',
  tagline TEXT,
  hero_headline TEXT,
  hero_subheadline TEXT,
  hero_image_url TEXT,
  about_text TEXT,
  cta_text TEXT DEFAULT 'Get a Free Quote',
  meta_title TEXT,
  meta_description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  hours JSONB DEFAULT '{}'::jsonb,
  socials JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_sites TO authenticated;
GRANT ALL ON public.tenant_sites TO service_role;
ALTER TABLE public.tenant_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their tenant site"
  ON public.tenant_sites FOR ALL TO authenticated
  USING (private.is_business_owner(business_id))
  WITH CHECK (private.is_business_owner(business_id));

CREATE TRIGGER trg_tenant_sites_updated_at BEFORE UPDATE ON public.tenant_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) tenant_site_services
CREATE TABLE public.tenant_site_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_from NUMERIC,
  icon TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_site_services TO authenticated;
GRANT ALL ON public.tenant_site_services TO service_role;
ALTER TABLE public.tenant_site_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage tenant services"
  ON public.tenant_site_services FOR ALL TO authenticated
  USING (private.is_business_owner(business_id))
  WITH CHECK (private.is_business_owner(business_id));

CREATE TRIGGER trg_tenant_site_services_updated_at BEFORE UPDATE ON public.tenant_site_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) tenant_site_areas
CREATE TABLE public.tenant_site_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT,
  slug TEXT NOT NULL,
  headline TEXT,
  body TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_site_areas TO authenticated;
GRANT ALL ON public.tenant_site_areas TO service_role;
ALTER TABLE public.tenant_site_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage tenant areas"
  ON public.tenant_site_areas FOR ALL TO authenticated
  USING (private.is_business_owner(business_id))
  WITH CHECK (private.is_business_owner(business_id));

CREATE TRIGGER trg_tenant_site_areas_updated_at BEFORE UPDATE ON public.tenant_site_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) tenant_blog_posts
CREATE TABLE public.tenant_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body_md TEXT,
  cover_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_blog_posts TO authenticated;
GRANT ALL ON public.tenant_blog_posts TO service_role;
ALTER TABLE public.tenant_blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage tenant blog posts"
  ON public.tenant_blog_posts FOR ALL TO authenticated
  USING (private.is_business_owner(business_id))
  WITH CHECK (private.is_business_owner(business_id));

CREATE TRIGGER trg_tenant_blog_posts_updated_at BEFORE UPDATE ON public.tenant_blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) tenant_site_faqs
CREATE TABLE public.tenant_site_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_site_faqs TO authenticated;
GRANT ALL ON public.tenant_site_faqs TO service_role;
ALTER TABLE public.tenant_site_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage tenant faqs"
  ON public.tenant_site_faqs FOR ALL TO authenticated
  USING (private.is_business_owner(business_id))
  WITH CHECK (private.is_business_owner(business_id));

CREATE TRIGGER trg_tenant_site_faqs_updated_at BEFORE UPDATE ON public.tenant_site_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Public bundle RPC (anyone, published only)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_tenant_site_bundle(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b RECORD;
  s public.tenant_sites%ROWTYPE;
  svcs JSONB;
  areas JSONB;
  posts JSONB;
  faqs JSONB;
  revs JSONB;
  rating_avg NUMERIC;
  rating_count INT;
BEGIN
  SELECT id, name, slug, industry, logo_url, phone, email, city, state, website
    INTO b FROM public.businesses WHERE slug = p_slug LIMIT 1;
  IF b.id IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO s FROM public.tenant_sites WHERE business_id = b.id;
  IF s.id IS NULL OR s.published = false THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.sort_order), '[]'::jsonb) INTO svcs
    FROM public.tenant_site_services x WHERE business_id = b.id AND is_active = true;

  SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb) INTO areas
    FROM public.tenant_site_areas x WHERE business_id = b.id AND is_active = true;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.published_at DESC), '[]'::jsonb) INTO posts
    FROM public.tenant_blog_posts x WHERE business_id = b.id AND published = true;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.sort_order), '[]'::jsonb) INTO faqs
    FROM public.tenant_site_faqs x WHERE business_id = b.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'rating', r.rating, 'comment', r.comment, 'created_at', r.created_at,
      'author', COALESCE(c.first_name || ' ' || LEFT(COALESCE(c.last_name,''),1), 'Customer')
    ) ORDER BY r.created_at DESC), '[]'::jsonb),
    COALESCE(AVG(r.rating)::numeric(3,2), 0), COALESCE(COUNT(*), 0)
    INTO revs, rating_avg, rating_count
    FROM public.reviews r
    LEFT JOIN public.customers c ON c.id = r.customer_id
    WHERE r.business_id = b.id AND r.is_public = true;

  RETURN jsonb_build_object(
    'business', to_jsonb(b),
    'site', to_jsonb(s),
    'services', svcs,
    'areas', areas,
    'posts', posts,
    'faqs', faqs,
    'reviews', revs,
    'rating_avg', rating_avg,
    'rating_count', rating_count
  );
END $$;

GRANT EXECUTE ON FUNCTION public.get_tenant_site_bundle(TEXT) TO anon, authenticated;
