-- Copilot conversation persistence
CREATE TABLE copilot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  messages JSONB NOT NULL DEFAULT '[]',
  title TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_copilot_account ON copilot_conversations(account_id, user_id, is_active);
CREATE INDEX idx_copilot_org ON copilot_conversations(org_id);

-- Add copilot_context type to account_ai_summaries
ALTER TABLE account_ai_summaries
  DROP CONSTRAINT IF EXISTS account_ai_summaries_type_check;

ALTER TABLE account_ai_summaries
  ADD CONSTRAINT account_ai_summaries_type_check
  CHECK (type IN ('weekly_summary', 'meeting_brief', 'risk_alert', 'copilot_context'));

-- RLS
ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_copilot_conversations"
  ON copilot_conversations
  FOR ALL
  USING (
    org_id = (
      SELECT (raw_app_meta_data->>'org_id')::uuid
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- updated_at trigger
CREATE TRIGGER set_copilot_conversations_updated_at
  BEFORE UPDATE ON copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
