
CREATE TABLE IF NOT EXISTS public.call_quote_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_quote_id uuid NOT NULL REFERENCES public.call_quotes(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_call_quote_events_quote ON public.call_quote_events(call_quote_id, created_at DESC);

GRANT SELECT ON public.call_quote_events TO authenticated;
GRANT ALL ON public.call_quote_events TO service_role;

ALTER TABLE public.call_quote_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business team can read call quote events" ON public.call_quote_events;
CREATE POLICY "Business team can read call quote events"
ON public.call_quote_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.call_quotes cq
    LEFT JOIN public.businesses b ON b.id = cq.business_id
    LEFT JOIN public.team_members tm ON tm.business_id = cq.business_id AND tm.user_id = auth.uid() AND tm.is_active = true
    WHERE cq.id = call_quote_events.call_quote_id
      AND (b.owner_id = auth.uid() OR tm.id IS NOT NULL)
  )
);

ALTER TABLE public.call_quote_events REPLICA IDENTITY FULL;
ALTER TABLE public.call_quotes REPLICA IDENTITY FULL;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.call_quote_events';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.call_quotes';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public._log_call_quote_event(p_quote_id uuid, p_event_type text, p_meta jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.call_quote_events (call_quote_id, event_type, meta)
  VALUES (p_quote_id, p_event_type, COALESCE(p_meta, '{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.mark_call_quote_viewed(p_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q_id uuid; was_viewed timestamptz;
BEGIN
  SELECT id, viewed_at INTO q_id, was_viewed FROM public.call_quotes WHERE share_token = p_token LIMIT 1;
  IF q_id IS NULL THEN RETURN; END IF;
  UPDATE public.call_quotes
  SET viewed_at = COALESCE(viewed_at, now()),
      status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END
  WHERE id = q_id;
  IF was_viewed IS NULL THEN
    PERFORM public._log_call_quote_event(q_id, 'viewed', '{}'::jsonb);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.accept_call_quote(p_token text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q_id uuid;
BEGIN
  UPDATE public.call_quotes
  SET accepted_at = now(), status = 'accepted'
  WHERE share_token = p_token
    AND (expires_at IS NULL OR expires_at > now())
    AND status NOT IN ('paid')
  RETURNING id INTO q_id;
  IF q_id IS NOT NULL THEN
    PERFORM public._log_call_quote_event(q_id, 'accepted', '{}'::jsonb);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.customer_update_call_quote_selection(
  p_token text, p_included_addon_ids text[]
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q public.call_quotes%ROWTYPE;
  new_addons jsonb := '[]'::jsonb;
  a jsonb; is_req boolean; is_inc boolean; addon_id text;
  addon_total numeric := 0; room_cost numeric := 0; base numeric := 0;
  new_subtotal numeric := 0; new_total numeric := 0; discount numeric := 0;
BEGIN
  SELECT * INTO q FROM public.call_quotes WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
  IF q.expires_at IS NOT NULL AND q.expires_at < now() THEN RAISE EXCEPTION 'Quote expired'; END IF;
  IF q.status = 'paid' THEN RAISE EXCEPTION 'Quote already paid'; END IF;
  IF q.manual_override THEN
    PERFORM public._log_call_quote_event(q.id, 'addons_change_blocked', jsonb_build_object('reason','manual_override'));
    RETURN public.get_call_quote_by_token(p_token);
  END IF;

  FOR a IN SELECT * FROM jsonb_array_elements(COALESCE(q.addons, '[]'::jsonb))
  LOOP
    addon_id := a->>'id';
    is_req := COALESCE((a->>'required')::boolean, false);
    is_inc := is_req OR (addon_id = ANY(p_included_addon_ids));
    new_addons := new_addons || jsonb_build_array(
      jsonb_set(jsonb_set(a, '{required}', to_jsonb(is_req)), '{included}', to_jsonb(is_inc))
    );
    IF is_inc THEN
      addon_total := addon_total + COALESCE((a->>'price')::numeric, 0);
    END IF;
  END LOOP;

  base := COALESCE((q.breakdown->>'base')::numeric, 0);
  room_cost := COALESCE((q.breakdown->'rooms'->>'cost')::numeric, 0);
  new_subtotal := base + room_cost + addon_total;

  IF q.breakdown ? 'coupon_percent' THEN
    discount := LEAST(new_subtotal, new_subtotal * COALESCE((q.breakdown->>'coupon_percent')::numeric,0) / 100);
  ELSE
    discount := LEAST(new_subtotal, COALESCE(q.discount_amount, 0));
  END IF;
  new_total := GREATEST(0, new_subtotal - discount);

  UPDATE public.call_quotes
  SET addons = new_addons,
      subtotal = new_subtotal,
      discount_amount = discount,
      total = new_total,
      breakdown = jsonb_set(q.breakdown, '{addons_cost}', to_jsonb(addon_total))
  WHERE id = q.id;

  PERFORM public._log_call_quote_event(q.id, 'addons_updated', jsonb_build_object(
    'included', p_included_addon_ids, 'new_total', new_total
  ));

  RETURN public.get_call_quote_by_token(p_token);
END; $$;

CREATE OR REPLACE FUNCTION public.get_call_quote_events_by_token(p_token text)
RETURNS TABLE(event_type text, meta jsonb, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.event_type, e.meta, e.created_at
  FROM public.call_quote_events e
  JOIN public.call_quotes q ON q.id = e.call_quote_id
  WHERE q.share_token = p_token
  ORDER BY e.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.customer_update_call_quote_selection(text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_update_call_quote_selection(text, text[]) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_call_quote_events_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_call_quote_events_by_token(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public._log_call_quote_event(uuid, text, jsonb) FROM PUBLIC;
