CREATE TABLE IF NOT EXISTS public.cleaning_custom_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  label text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_custom_services TO authenticated;
GRANT ALL ON public.cleaning_custom_services TO service_role;

ALTER TABLE public.cleaning_custom_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members manage custom services"
ON public.cleaning_custom_services
FOR ALL
TO authenticated
USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));

CREATE INDEX IF NOT EXISTS idx_cleaning_custom_services_business
  ON public.cleaning_custom_services (business_id, sort_order);

CREATE TRIGGER trg_cleaning_custom_services_updated_at
BEFORE UPDATE ON public.cleaning_custom_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_cleaning_custom_services(p_business_id uuid)
RETURNS TABLE(id uuid, label text, price numeric, enabled boolean, sort_order integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, label, price, enabled, sort_order
  FROM public.cleaning_custom_services
  WHERE business_id = p_business_id AND enabled = true
  ORDER BY sort_order, created_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_cleaning_custom_services(uuid) TO anon, authenticated;

INSERT INTO public.cleaning_custom_services (business_id, label, price, enabled, sort_order)
SELECT c.business_id,
       COALESCE(NULLIF(s.value->>'label',''), 'Custom Service'),
       COALESCE((s.value->>'price')::numeric, 0),
       COALESCE((s.value->>'enabled')::boolean, true),
       (s.ordinality - 1)::int
FROM public.cleaning_wizard_config c
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.custom_services, '[]'::jsonb)) WITH ORDINALITY AS s(value, ordinality)
WHERE NOT EXISTS (
  SELECT 1 FROM public.cleaning_custom_services x WHERE x.business_id = c.business_id
);