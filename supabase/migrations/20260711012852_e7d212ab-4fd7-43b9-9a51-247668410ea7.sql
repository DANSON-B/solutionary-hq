
-- Bulk apply default templates to all future/incomplete jobs missing a checklist
CREATE OR REPLACE FUNCTION public.bulk_apply_default_checklist_templates(p_business_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  j record;
  tmpl_id uuid;
  applied int := 0;
BEGIN
  IF NOT (public.is_business_owner(p_business_id) OR public.is_team_member(p_business_id)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR j IN
    SELECT id, service_type FROM public.jobs
    WHERE business_id = p_business_id
      AND status IN ('scheduled','in_progress')
      AND NOT EXISTS (SELECT 1 FROM public.job_checklist_items ci WHERE ci.job_id = jobs.id)
  LOOP
    SELECT id INTO tmpl_id FROM public.checklist_templates
    WHERE business_id = p_business_id
      AND is_active = true
      AND is_default = true
      AND (service_type = COALESCE(j.service_type, 'other') OR service_type = 'other')
    ORDER BY (service_type = COALESCE(j.service_type,'other')) DESC
    LIMIT 1;

    IF tmpl_id IS NOT NULL THEN
      PERFORM public.apply_checklist_template_to_job(j.id, tmpl_id);
      applied := applied + 1;
    END IF;
  END LOOP;

  RETURN applied;
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_apply_default_checklist_templates(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_apply_default_checklist_templates(uuid) TO authenticated;

-- Update get_portal_bundle to gate checklist visibility on business_settings.checklist_customer_visible
CREATE OR REPLACE FUNCTION public.get_portal_bundle(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tk record;
  cust jsonb; biz jsonb;
  q jsonb; inv jsonb; jb jsonb; sr jsonb; cl jsonb; ph jsonb;
  show_checklist boolean := true;
BEGIN
  SELECT customer_id, business_id INTO tk
  FROM public.customer_portal_tokens
  WHERE token = p_token AND expires_at > now() LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(checklist_customer_visible, true) INTO show_checklist
  FROM public.business_settings WHERE business_id = tk.business_id;

  SELECT to_jsonb(c.*) INTO cust FROM public.customers c WHERE id = tk.customer_id;
  SELECT jsonb_build_object('name', b.name, 'email', b.email, 'phone', b.phone, 'logo_url', b.logo_url)
    INTO biz FROM public.businesses b WHERE id = tk.business_id;

  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO q
  FROM (
    SELECT qq.*, COALESCE((SELECT jsonb_agg(to_jsonb(qi.*)) FROM public.quote_items qi WHERE qi.quote_id = qq.id), '[]'::jsonb) AS quote_items
    FROM public.quotes qq WHERE qq.customer_id = tk.customer_id ORDER BY qq.created_at DESC
  ) x;

  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) INTO inv
  FROM (
    SELECT ii.*, COALESCE((SELECT jsonb_agg(to_jsonb(it.*)) FROM public.invoice_items it WHERE it.invoice_id = ii.id), '[]'::jsonb) AS invoice_items
    FROM public.invoices ii WHERE ii.customer_id = tk.customer_id ORDER BY ii.created_at DESC
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(j.*) ORDER BY j.scheduled_start DESC NULLS LAST), '[]'::jsonb) INTO jb
  FROM public.jobs j WHERE j.customer_id = tk.customer_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(s.*) ORDER BY s.created_at DESC), '[]'::jsonb) INTO sr
  FROM public.service_requests s WHERE s.customer_id = tk.customer_id;

  IF show_checklist THEN
    SELECT COALESCE(jsonb_agg(to_jsonb(ci.*) ORDER BY ci.sort_order), '[]'::jsonb) INTO cl
    FROM public.job_checklist_items ci
    WHERE ci.job_id IN (SELECT id FROM public.jobs WHERE customer_id = tk.customer_id);
  ELSE
    cl := '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(p.*) ORDER BY p.created_at), '[]'::jsonb) INTO ph
  FROM public.job_photos p
  WHERE p.job_id IN (SELECT id FROM public.jobs WHERE customer_id = tk.customer_id);

  RETURN jsonb_build_object(
    'customer_id', tk.customer_id,
    'business_id', tk.business_id,
    'customer', cust,
    'business', biz,
    'checklist_visible', show_checklist,
    'quotes', q,
    'invoices', inv,
    'jobs', jb,
    'service_requests', sr,
    'checklist_items', cl,
    'job_photos', ph
  );
END $function$;
