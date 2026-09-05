CREATE POLICY "Owners manage their wizard config"
ON public.cleaning_wizard_config
FOR ALL
TO authenticated
USING (private.is_business_owner(business_id))
WITH CHECK (private.is_business_owner(business_id));