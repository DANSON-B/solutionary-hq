DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customers'
      AND policyname = 'Anonymous users can create customers'
  ) THEN
    CREATE POLICY "Anonymous users can create customers"
    ON public.customers
    FOR INSERT
    TO anon
    WITH CHECK (true);
  END IF;
END $$;