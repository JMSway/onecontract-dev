-- 1. ОРГАНИЗАЦИИ (школы)
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bin TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ПОЛЬЗОВАТЕЛИ
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  needs_approval BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ШАБЛОНЫ ДОГОВОРОВ
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]',
  source_file_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ДОГОВОРЫ
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES templates(id),
  data JSONB DEFAULT '{}',
  pdf_url TEXT,
  pdf_hash TEXT,
  status TEXT DEFAULT 'draft' CHECK (
    status IN ('draft','pending_approval','sent','viewed','signed','declined','expired')
  ),
  sent_via TEXT CHECK (sent_via IN ('sms','email')),
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- 5. ПОДПИСИ
CREATE TABLE signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
  method TEXT CHECK (method IN ('sms_otp','egov_qr')),
  signer_ip TEXT,
  signer_ua TEXT,
  signer_iin TEXT,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_verified_at TIMESTAMPTZ,
  egov_signature_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. АУДИТ ЛОГ
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor TEXT,
  ip TEXT,
  ua TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ИНДЕКСЫ для скорости
CREATE INDEX idx_contracts_org_id ON contracts(org_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_templates_org_id ON templates(org_id);
CREATE INDEX idx_audit_contract_id ON audit_log(contract_id);

-- RLS (защита: каждая организация видит только свои данные)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ПОЛИТИКИ ДОСТУПА

-- Organizations: видишь только свою
CREATE POLICY "users_see_own_org" ON organizations
  FOR ALL USING (
    id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Users: видишь только пользователей своей орг
CREATE POLICY "users_see_org_members" ON users
  FOR ALL USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Templates: только своя орг
CREATE POLICY "org_templates" ON templates
  FOR ALL USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Contracts: owner видит все, manager только свои
CREATE POLICY "contracts_owner_all" ON contracts
  FOR ALL USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'owner'
      OR created_by = auth.uid()
    )
  );

-- Signatures: через договоры своей орг
CREATE POLICY "signatures_via_contracts" ON signatures
  FOR ALL USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- Audit log: через договоры своей орг
CREATE POLICY "audit_via_contracts" ON audit_log
  FOR ALL USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- ФУНКЦИЯ: автоматически создаёт запись user при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'owner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ТРИГГЕР: при каждой регистрации → создать user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
