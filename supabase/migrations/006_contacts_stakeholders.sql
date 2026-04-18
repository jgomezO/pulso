-- New stakeholder fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS title               TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone               TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS role_type           TEXT DEFAULT 'user'
  CHECK (role_type IN ('champion','decision_maker','user','billing','technical','executive'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS influence_level     TEXT DEFAULT 'medium'
  CHECK (influence_level IN ('low','medium','high'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'active'
  CHECK (relationship_status IN ('active','inactive','new','churned'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes               TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_url          TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at   TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at          TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contacts_account_active
  ON contacts(account_id) WHERE deleted_at IS NULL;
