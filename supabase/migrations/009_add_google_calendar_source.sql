-- Add 'google_calendar' to account_events source constraint
ALTER TABLE account_events DROP CONSTRAINT IF EXISTS account_events_source_check;
ALTER TABLE account_events ADD CONSTRAINT account_events_source_check
  CHECK (source IS NULL OR source IN ('manual', 'hubspot', 'intercom', 'segment', 'google_calendar'));

-- Add 'google_calendar' to integration_configs type constraint
ALTER TABLE integration_configs DROP CONSTRAINT IF EXISTS integration_configs_type_check;
ALTER TABLE integration_configs ADD CONSTRAINT integration_configs_type_check
  CHECK (type IN ('hubspot', 'intercom', 'slack', 'segment', 'google_calendar'));

-- Add unique constraint for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integration_configs_org_type_unique'
      AND conrelid = 'integration_configs'::regclass
  ) THEN
    ALTER TABLE integration_configs ADD CONSTRAINT integration_configs_org_type_unique
      UNIQUE (org_id, type);
  END IF;
END $$;

-- Add updated_at column
ALTER TABLE integration_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
