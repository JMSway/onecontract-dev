-- Align repo migrations with production schema (applied manually via SQL Editor).
-- Safe to run multiple times: all DROPs are IF EXISTS.

-- 1. Users RLS: собственная строка (нужно для триггера + чтение профиля)
DROP POLICY IF EXISTS "users_see_org_members" ON users;
DROP POLICY IF EXISTS "users_own_row" ON users;
CREATE POLICY "users_own_row" ON users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. Organizations RLS: insert любому авторизованному, select/update — только своя
DROP POLICY IF EXISTS "users_see_own_org" ON organizations;
DROP POLICY IF EXISTS "orgs_insert" ON organizations;
DROP POLICY IF EXISTS "orgs_select" ON organizations;
DROP POLICY IF EXISTS "orgs_update" ON organizations;
CREATE POLICY "orgs_insert" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "orgs_select" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );
CREATE POLICY "orgs_update" ON organizations
  FOR UPDATE USING (
    id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- 3. Templates RLS: только своя орг
DROP POLICY IF EXISTS "org_templates" ON templates;
DROP POLICY IF EXISTS "templates_own_org" ON templates;
CREATE POLICY "templates_own_org" ON templates
  FOR ALL
  USING     (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- 4. Contracts RLS: owner видит все, manager — только свои (RBAC из CLAUDE.md)
DROP POLICY IF EXISTS "contracts_owner_all" ON contracts;
DROP POLICY IF EXISTS "contracts_own_org" ON contracts;
DROP POLICY IF EXISTS "contracts_owner_or_own" ON contracts;
CREATE POLICY "contracts_owner_or_own" ON contracts
  FOR ALL
  USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- 5. Signatures RLS: через договоры своей орг
DROP POLICY IF EXISTS "signatures_via_contracts" ON signatures;
DROP POLICY IF EXISTS "signatures_own_org" ON signatures;
CREATE POLICY "signatures_own_org" ON signatures
  FOR ALL USING (
    contract_id IN (
      SELECT c.id FROM contracts c
      JOIN users u ON u.org_id = c.org_id
      WHERE u.id = auth.uid()
    )
  );

-- 6. Audit log RLS: через договоры своей орг
DROP POLICY IF EXISTS "audit_via_contracts" ON audit_log;
DROP POLICY IF EXISTS "audit_own_org" ON audit_log;
CREATE POLICY "audit_own_org" ON audit_log
  FOR ALL USING (
    contract_id IN (
      SELECT c.id FROM contracts c
      JOIN users u ON u.org_id = c.org_id
      WHERE u.id = auth.uid()
    )
  );

-- 7. Триггер handle_new_user: корректный fallback + фиксация search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'owner'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. Сбросить schema-cache PostgREST (обязательно после ручных SQL)
NOTIFY pgrst, 'reload schema';
