
-- Business settings table for configurable options
CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  default_tax_rate numeric DEFAULT 0,
  quote_valid_days integer DEFAULT 30,
  invoice_due_days integer DEFAULT 30,
  auto_review_request boolean DEFAULT true,
  quote_footer_note text DEFAULT null,
  invoice_footer_note text DEFAULT null,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage settings"
  ON public.business_settings FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Auto-create settings row when business is created
CREATE OR REPLACE FUNCTION public.auto_create_business_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO business_settings (business_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created_create_settings
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_business_settings();

-- Create settings for existing businesses that don't have them
INSERT INTO business_settings (business_id)
SELECT id FROM businesses WHERE id NOT IN (SELECT business_id FROM business_settings);

-- Create a storage bucket for business logos
INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for business-assets bucket
CREATE POLICY "Authenticated users can upload business assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Authenticated users can update own business assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-assets');

CREATE POLICY "Anyone can view business assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'business-assets');

CREATE POLICY "Authenticated users can delete own business assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'business-assets');
