
CREATE POLICY "Business owners manage call_quotes"
ON public.call_quotes FOR ALL TO authenticated
USING (private.is_business_owner(business_id) OR private.is_team_member(business_id))
WITH CHECK (private.is_business_owner(business_id) OR private.is_team_member(business_id));
