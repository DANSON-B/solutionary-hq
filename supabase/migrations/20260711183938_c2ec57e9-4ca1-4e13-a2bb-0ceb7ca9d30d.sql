
-- Allow team members to view their own payroll line items (earnings only)
CREATE POLICY "Team members can view own payroll lines"
ON public.payroll_line_items
FOR SELECT
TO authenticated
USING (
  team_member_id IN (
    SELECT id FROM public.team_members WHERE user_id = auth.uid()
  )
);

-- Allow team members to view the payroll period metadata for their own lines
CREATE POLICY "Team members can view own payroll periods"
ON public.payroll_periods
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT period_id FROM public.payroll_line_items li
    JOIN public.team_members tm ON tm.id = li.team_member_id
    WHERE tm.user_id = auth.uid()
  )
);
