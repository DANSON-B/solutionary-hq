
CREATE OR REPLACE FUNCTION public.get_portal_bundle(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tk record;
  cust jsonb; biz jsonb;
  q jsonb; inv jsonb; jb jsonb; sr jsonb; cl jsonb; ph jsonb; mem jsonb;
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

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', cm.id,
      'status', cm.status,
      'started_at', cm.started_at,
      'next_billing_at', cm.next_billing_at,
      'cancelled_at', cm.cancelled_at,
      'membership', jsonb_build_object(
        'id', m.id,
        'name', m.name,
        'description', m.description,
        'price_cents', m.price_cents,
        'billing_interval', m.billing_interval,
        'perks', m.perks
      )
    )
    ORDER BY cm.started_at DESC
  ), '[]'::jsonb) INTO mem
  FROM public.customer_memberships cm
  LEFT JOIN public.memberships m ON m.id = cm.membership_id
  WHERE cm.customer_id = tk.customer_id;

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
    'job_photos', ph,
    'memberships', mem
  );
END $function$;
