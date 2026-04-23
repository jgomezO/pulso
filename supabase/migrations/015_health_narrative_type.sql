-- Extend account_ai_summaries to support health_narrative type
-- and add metadata JSONB column for caching context (e.g. score_at_generation)

ALTER TABLE account_ai_summaries
  DROP CONSTRAINT IF EXISTS account_ai_summaries_type_check;

ALTER TABLE account_ai_summaries
  ADD CONSTRAINT account_ai_summaries_type_check
  CHECK (type IN ('weekly_summary','meeting_brief','risk_alert','copilot_context','health_narrative'));

ALTER TABLE account_ai_summaries
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
