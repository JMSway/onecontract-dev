-- Atomic org creation + user linking. Обходит RLS deadlock в .insert().select().single():
-- SELECT-policy на organizations требует org_id в users, а он появляется только после UPDATE.
-- RPC делает обе операции в одной транзакции от имени SECURITY DEFINER.

CREATE OR REPLACE FUNCTION create_organization(org_name TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  trimmed_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  trimmed_name := trim(org_name);
  IF trimmed_name = '' OR trimmed_name IS NULL THEN
    RAISE EXCEPTION 'Organization name is required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO organizations (name)
  VALUES (trimmed_name)
  RETURNING organizations.id INTO new_org_id;

  UPDATE users
  SET org_id = new_org_id
  WHERE users.id = auth.uid();

  RETURN QUERY
    SELECT o.id, o.name
    FROM organizations o
    WHERE o.id = new_org_id;
END;
$$;

REVOKE ALL ON FUNCTION create_organization(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_organization(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
