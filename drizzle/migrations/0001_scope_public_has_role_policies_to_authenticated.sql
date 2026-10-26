DO $$
DECLARE
  target record;
  changed_count integer := 0;
BEGIN
  FOR target IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE 'public' = ANY (roles)
      AND (qual ~ '\mhas_role\s*\(' OR with_check ~ '\mhas_role\s*\(')
    ORDER BY schemaname, tablename, policyname
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated',
      target.policyname, target.schemaname, target.tablename
    );
    changed_count := changed_count + 1;
  END LOOP;

  IF changed_count <> 60 THEN
    RAISE EXCEPTION 'Expected 60 policy changes, got %', changed_count;
  END IF;
END;
$$;