-- Organizaciones (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cuentas cliente
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  arr DECIMAL(12,2),
  mrr DECIMAL(12,2),
  tier TEXT CHECK (tier IN ('enterprise', 'growth', 'starter')),
  renewal_date DATE,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  health_trend TEXT CHECK (health_trend IN ('improving', 'stable', 'declining')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  csm_id UUID REFERENCES auth.users(id),
  hubspot_id TEXT,
  intercom_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contactos por cuenta
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  is_champion BOOLEAN DEFAULT FALSE,
  is_decision_maker BOOLEAN DEFAULT FALSE,
  last_activity_at TIMESTAMPTZ,
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  hubspot_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline de eventos
CREATE TABLE account_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('support_ticket', 'email', 'meeting', 'product_usage', 'nps', 'renewal')),
  source TEXT CHECK (source IN ('intercom', 'hubspot', 'segment', 'manual')),
  title TEXT,
  description TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health score histórico
CREATE TABLE health_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  signals JSONB,
  ai_explanation TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Síntesis AI cacheadas
CREATE TABLE account_ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('weekly_summary', 'meeting_brief', 'risk_alert')),
  content TEXT NOT NULL,
  model TEXT DEFAULT 'claude-sonnet-4-6',
  tokens_used INTEGER,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integraciones por tenant
CREATE TABLE integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hubspot', 'intercom', 'slack', 'segment')),
  credentials JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_accounts_org ON accounts(org_id);
CREATE INDEX idx_accounts_csm ON accounts(csm_id);
CREATE INDEX idx_events_account ON account_events(account_id, occurred_at DESC);
CREATE INDEX idx_health_history_account ON health_score_history(account_id, calculated_at DESC);
CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_ai_summaries_account ON account_ai_summaries(account_id, generated_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access data from their own organization
-- (org membership via a join table or via JWT claims — using JWT app_metadata.org_id)

CREATE POLICY "org_isolation_accounts" ON accounts
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID);

CREATE POLICY "org_isolation_contacts" ON contacts
  USING (account_id IN (
    SELECT id FROM accounts
    WHERE org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID
  ));

CREATE POLICY "org_isolation_events" ON account_events
  USING (account_id IN (
    SELECT id FROM accounts
    WHERE org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID
  ));

CREATE POLICY "org_isolation_health_history" ON health_score_history
  USING (account_id IN (
    SELECT id FROM accounts
    WHERE org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID
  ));

CREATE POLICY "org_isolation_ai_summaries" ON account_ai_summaries
  USING (account_id IN (
    SELECT id FROM accounts
    WHERE org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID
  ));

CREATE POLICY "org_isolation_integration_configs" ON integration_configs
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID);

CREATE POLICY "org_isolation_organizations" ON organizations
  USING (id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID);
