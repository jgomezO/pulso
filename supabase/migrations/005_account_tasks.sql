CREATE TABLE IF NOT EXISTS account_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority     TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high','urgent')),
  due_date     DATE,
  assigned_to  UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  source       TEXT NOT NULL DEFAULT 'manual'
                 CHECK (source IN ('manual','playbook','ai_suggestion')),
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_account  ON account_tasks(account_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON account_tasks(assigned_to, status, due_date);
DROP TRIGGER IF EXISTS update_account_tasks_updated_at ON account_tasks;

CREATE TRIGGER update_account_tasks_updated_at
  BEFORE UPDATE ON account_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE account_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_isolation_tasks" ON account_tasks;

CREATE POLICY "org_isolation_tasks" ON account_tasks
  USING (account_id IN (
    SELECT id FROM accounts
    WHERE org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID
  ));
