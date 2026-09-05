
-- 1. Create a security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE business_id = _business_id
      AND user_id = auth.uid()
      AND is_active = true
  )
$$;

-- 2. Helper: check if user is owner OR team member
CREATE OR REPLACE FUNCTION public.is_business_member(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = _business_id AND owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE business_id = _business_id
      AND user_id = auth.uid()
      AND is_active = true
  )
$$;

-- 3. businesses: team members can view their business
CREATE POLICY "Team members can view their business"
ON public.businesses FOR SELECT TO authenticated
USING (public.is_team_member(id));

-- 4. jobs: team members can view and update jobs in their business
CREATE POLICY "Team members can view jobs"
ON public.jobs FOR SELECT TO authenticated
USING (public.is_team_member(business_id));

CREATE POLICY "Team members can update jobs"
ON public.jobs FOR UPDATE TO authenticated
USING (public.is_team_member(business_id))
WITH CHECK (public.is_team_member(business_id));

-- 5. customers: team members can view customers
CREATE POLICY "Team members can view customers"
ON public.customers FOR SELECT TO authenticated
USING (public.is_team_member(business_id));

-- 6. job_checklist_items: team members can view and update
CREATE POLICY "Team members can view checklist items"
ON public.job_checklist_items FOR SELECT TO authenticated
USING (public.is_team_member(business_id));

CREATE POLICY "Team members can update checklist items"
ON public.job_checklist_items FOR UPDATE TO authenticated
USING (public.is_team_member(business_id))
WITH CHECK (public.is_team_member(business_id));

-- 7. job_notes: team members can view and insert
CREATE POLICY "Team members can view job notes"
ON public.job_notes FOR SELECT TO authenticated
USING (public.is_team_member(business_id));

CREATE POLICY "Team members can insert job notes"
ON public.job_notes FOR INSERT TO authenticated
WITH CHECK (public.is_team_member(business_id));

-- 8. team_members: members can view other members in their business
CREATE POLICY "Team members can view own team"
ON public.team_members FOR SELECT TO authenticated
USING (public.is_team_member(business_id));

-- 9. job_photos: team members can view and insert
CREATE POLICY "Team members can view job photos"
ON public.job_photos FOR SELECT TO authenticated
USING (public.is_team_member(business_id));

CREATE POLICY "Team members can insert job photos"
ON public.job_photos FOR INSERT TO authenticated
WITH CHECK (public.is_team_member(business_id));
