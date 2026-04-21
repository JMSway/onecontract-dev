-- Allow anonymous clients to read signed contracts for public QR-verify flow.
-- Signers scan the QR on their phone (no auth session) and land on /verify/[id].
-- The /api/verify/[id] route exposes only a minimal whitelist of fields
-- (org name, template name, signer name, signed_at). RLS on `contracts`
-- previously required auth.uid() so the query silently returned 0 rows.

-- Contracts: anyone can read signed contracts by known UUID.
DROP POLICY IF EXISTS "contracts_public_verify_signed" ON contracts;
CREATE POLICY "contracts_public_verify_signed" ON contracts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'signed');

-- Organizations: anon can read only orgs referenced by a signed contract.
DROP POLICY IF EXISTS "organizations_public_via_signed_contract" ON organizations;
CREATE POLICY "organizations_public_via_signed_contract" ON organizations
  FOR SELECT
  TO anon
  USING (
    id IN (SELECT org_id FROM contracts WHERE status = 'signed')
  );

-- Templates: anon can read only templates referenced by a signed contract.
DROP POLICY IF EXISTS "templates_public_via_signed_contract" ON templates;
CREATE POLICY "templates_public_via_signed_contract" ON templates
  FOR SELECT
  TO anon
  USING (
    id IN (SELECT template_id FROM contracts WHERE status = 'signed')
  );

-- Reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
