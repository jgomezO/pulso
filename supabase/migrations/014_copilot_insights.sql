CREATE TABLE copilot_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE (account_id, type, title)
);

CREATE INDEX idx_copilot_insights_account ON copilot_insights(account_id);
CREATE INDEX idx_copilot_insights_unread ON copilot_insights(account_id, is_read, is_dismissed);

ALTER TABLE copilot_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view insights for their org"
  ON copilot_insights FOR SELECT
  USING (org_id = (auth.jwt()->'app_metadata'->>'org_id')::uuid);

CREATE POLICY "Users can update insights for their org"
  ON copilot_insights FOR UPDATE
  USING (org_id = (auth.jwt()->'app_metadata'->>'org_id')::uuid);
