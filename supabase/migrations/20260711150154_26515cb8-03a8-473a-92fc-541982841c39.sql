
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  unit text NOT NULL DEFAULT 'each',
  on_hand numeric NOT NULL DEFAULT 0,
  reorder_threshold numeric NOT NULL DEFAULT 0,
  unit_cost_cents integer NOT NULL DEFAULT 0,
  vendor text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages inventory" ON public.inventory_items
  FOR ALL TO authenticated
  USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
  WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));
CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('purchase','usage','adjustment')),
  quantity numeric NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team manages inventory movements" ON public.inventory_movements
  FOR ALL TO authenticated
  USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
  WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));
CREATE INDEX IF NOT EXISTS idx_inv_moves_item ON public.inventory_movements (item_id);

-- Trigger to update on_hand on each movement
CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.movement_type = 'purchase' THEN
    UPDATE public.inventory_items SET on_hand = on_hand + NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.movement_type = 'usage' THEN
    UPDATE public.inventory_items SET on_hand = GREATEST(0, on_hand - NEW.quantity) WHERE id = NEW.item_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE public.inventory_items SET on_hand = NEW.quantity WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_apply_inv_movement ON public.inventory_movements;
CREATE TRIGGER trg_apply_inv_movement AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

-- Accounting exports log
CREATE TABLE IF NOT EXISTS public.accounting_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  export_type text NOT NULL CHECK (export_type IN ('invoices','payments','payroll')),
  format text NOT NULL DEFAULT 'csv' CHECK (format IN ('csv','json')),
  period_start date,
  period_end date,
  row_count integer NOT NULL DEFAULT 0,
  file_url text,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','failed')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_exports TO authenticated;
GRANT ALL ON public.accounting_exports TO service_role;
ALTER TABLE public.accounting_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team views accounting exports" ON public.accounting_exports
  FOR ALL TO authenticated
  USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
  WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));
