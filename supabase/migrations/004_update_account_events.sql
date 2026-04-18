-- Drop old constraints first so the data migrations don't violate them
ALTER TABLE account_events DROP CONSTRAINT IF EXISTS account_events_type_check;

-- Migrate old event types to new schema
UPDATE account_events SET type = 'ticket' WHERE type = 'support_ticket';
UPDATE account_events SET type = 'note'   WHERE type IN ('product_usage', 'nps');

-- Add new constraint with expanded types
ALTER TABLE account_events ADD CONSTRAINT account_events_type_check
  CHECK (type IN ('note','email','call','meeting','ticket','health_change','renewal','milestone'));

-- Drop old source constraint and re-add ensuring 'manual' is included
ALTER TABLE account_events DROP CONSTRAINT IF EXISTS account_events_source_check;
ALTER TABLE account_events ADD CONSTRAINT account_events_source_check
  CHECK (source IN ('manual','hubspot','intercom','segment'));

-- Add created_by to track who registered the activity
ALTER TABLE account_events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Index for counts query
CREATE INDEX IF NOT EXISTS idx_events_account_type ON account_events(account_id, type);
