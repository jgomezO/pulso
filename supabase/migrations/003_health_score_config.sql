CREATE TABLE IF NOT EXISTS health_score_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  signals JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id)
);

CREATE TABLE IF NOT EXISTS account_signal_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  signal_key TEXT NOT NULL,
  value INTEGER CHECK (value >= 0 AND value <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, signal_key)
);
