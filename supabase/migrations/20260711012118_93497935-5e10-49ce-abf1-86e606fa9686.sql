
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS checklists_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS checklist_block_completion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checklist_customer_visible boolean NOT NULL DEFAULT true;

ALTER TABLE public.job_checklist_items
  ADD COLUMN IF NOT EXISTS room text,
  ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_id uuid REFERENCES public.job_photos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS completed_by uuid;

CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_type text NOT NULL DEFAULT 'standard',
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_templates TO authenticated;
GRANT ALL ON public.checklist_templates TO service_role;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage checklist templates"
  ON public.checklist_templates FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Team members read checklist templates"
  ON public.checklist_templates FOR SELECT TO authenticated
  USING (business_id IN (SELECT business_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE TRIGGER trg_checklist_templates_updated
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.checklist_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  room text,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  photo_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_template_items TO authenticated;
GRANT ALL ON public.checklist_template_items TO service_role;
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage template items"
  ON public.checklist_template_items FOR ALL TO authenticated
  USING (template_id IN (
    SELECT t.id FROM public.checklist_templates t
    JOIN public.businesses b ON b.id = t.business_id
    WHERE b.owner_id = auth.uid()))
  WITH CHECK (template_id IN (
    SELECT t.id FROM public.checklist_templates t
    JOIN public.businesses b ON b.id = t.business_id
    WHERE b.owner_id = auth.uid()));
CREATE POLICY "Team reads template items"
  ON public.checklist_template_items FOR SELECT TO authenticated
  USING (template_id IN (
    SELECT t.id FROM public.checklist_templates t
    JOIN public.team_members tm ON tm.business_id = t.business_id
    WHERE tm.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.apply_checklist_template_to_job(p_job_id uuid, p_template_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_biz uuid; v_count int := 0;
BEGIN
  SELECT business_id INTO v_biz FROM public.jobs WHERE id = p_job_id;
  IF v_biz IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE id = p_template_id AND business_id = v_biz) THEN
    RAISE EXCEPTION 'Template not found for this business';
  END IF;
  DELETE FROM public.job_checklist_items WHERE job_id = p_job_id AND sort_order < 1000;
  INSERT INTO public.job_checklist_items (job_id, business_id, label, room, sort_order, is_required, photo_required)
  SELECT p_job_id, v_biz, i.label, i.room, i.sort_order, i.is_required, i.photo_required
  FROM public.checklist_template_items i
  WHERE i.template_id = p_template_id
  ORDER BY i.sort_order;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_checklist_before_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_enabled boolean; v_block boolean; v_missing int;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT COALESCE(checklists_enabled,true), COALESCE(checklist_block_completion,false)
      INTO v_enabled, v_block
      FROM public.business_settings WHERE business_id = NEW.business_id;
    IF v_enabled AND v_block THEN
      SELECT count(*) INTO v_missing
        FROM public.job_checklist_items
        WHERE job_id = NEW.id
          AND is_required = true
          AND (is_completed = false OR (photo_required = true AND photo_id IS NULL));
      IF v_missing > 0 THEN
        RAISE EXCEPTION 'Cannot complete job: % required checklist item(s) unfinished', v_missing
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_checklist_before_complete ON public.jobs;
CREATE TRIGGER trg_enforce_checklist_before_complete
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_checklist_before_complete();
