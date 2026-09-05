
-- Help admin check (support account)
CREATE OR REPLACE FUNCTION private.is_help_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT lower(coalesce((auth.jwt() ->> 'email'), '')) = 'support@solutionaryhq.com'
$$;

CREATE TABLE IF NOT EXISTS public.help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES public.help_categories(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  keywords text[] NOT NULL DEFAULT '{}',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  body text,
  video_url text,
  image_urls text[] NOT NULL DEFAULT '{}',
  related_slugs text[] NOT NULL DEFAULT '{}',
  routes text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS help_articles_category_idx ON public.help_articles(category_slug);

CREATE TABLE IF NOT EXISTS public.business_onboarding (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  completed_steps text[] NOT NULL DEFAULT '{}',
  skipped_steps text[] NOT NULL DEFAULT '{}',
  current_step integer NOT NULL DEFAULT 0,
  wizard_dismissed boolean NOT NULL DEFAULT false,
  checklist_dismissed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.help_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.help_categories TO authenticated;
GRANT ALL ON public.help_categories TO service_role;

GRANT SELECT ON public.help_articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.help_articles TO authenticated;
GRANT ALL ON public.help_articles TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.business_onboarding TO authenticated;
GRANT ALL ON public.business_onboarding TO service_role;

ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Help categories are public" ON public.help_categories FOR SELECT USING (true);
CREATE POLICY "Support admin manages categories" ON public.help_categories FOR ALL TO authenticated
  USING (private.is_help_admin()) WITH CHECK (private.is_help_admin());

CREATE POLICY "Published articles are public" ON public.help_articles FOR SELECT
  USING (published = true OR private.is_help_admin());
CREATE POLICY "Support admin manages articles" ON public.help_articles FOR ALL TO authenticated
  USING (private.is_help_admin()) WITH CHECK (private.is_help_admin());

CREATE POLICY "Business members read onboarding" ON public.business_onboarding FOR SELECT TO authenticated
  USING (private.is_business_member(business_id));
CREATE POLICY "Business members create onboarding" ON public.business_onboarding FOR INSERT TO authenticated
  WITH CHECK (private.is_business_member(business_id));
CREATE POLICY "Business members update onboarding" ON public.business_onboarding FOR UPDATE TO authenticated
  USING (private.is_business_member(business_id)) WITH CHECK (private.is_business_member(business_id));

CREATE OR REPLACE FUNCTION public.help_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER help_categories_updated BEFORE UPDATE ON public.help_categories FOR EACH ROW EXECUTE FUNCTION public.help_set_updated_at();
CREATE TRIGGER help_articles_updated BEFORE UPDATE ON public.help_articles FOR EACH ROW EXECUTE FUNCTION public.help_set_updated_at();
CREATE TRIGGER business_onboarding_updated BEFORE UPDATE ON public.business_onboarding FOR EACH ROW EXECUTE FUNCTION public.help_set_updated_at();
