DROP POLICY IF EXISTS "Anyone can view wizard config" ON public.cleaning_wizard_config;

REVOKE SELECT ON public.cleaning_wizard_config FROM anon;

CREATE OR REPLACE FUNCTION public.get_cleaning_wizard_config(p_business_id uuid)
RETURNS SETOF public.cleaning_wizard_config
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.cleaning_wizard_config WHERE business_id = p_business_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_cleaning_wizard_config(uuid) TO anon, authenticated;