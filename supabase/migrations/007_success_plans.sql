-- Success plans
CREATE TABLE IF NOT EXISTS success_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID REFERENCES accounts(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  objective     TEXT,
  template_type TEXT CHECK (template_type IN ('onboarding','at_risk','renewal','expansion','custom')),
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','completed','paused','cancelled')),
  start_date    DATE,
  target_date   DATE,
  progress      INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_success_plans_account ON success_plans(account_id) WHERE status = 'active';

-- Plan milestones
CREATE TABLE IF NOT EXISTS plan_milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID REFERENCES success_plans(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  sort_order   INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_milestones_plan ON plan_milestones(plan_id);

-- Link tasks to plans and milestones
ALTER TABLE account_tasks ADD COLUMN IF NOT EXISTS plan_id      UUID REFERENCES success_plans(id);
ALTER TABLE account_tasks ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES plan_milestones(id);

CREATE INDEX IF NOT EXISTS idx_tasks_plan ON account_tasks(plan_id) WHERE plan_id IS NOT NULL;

-- updated_at trigger for success_plans
CREATE OR REPLACE FUNCTION update_success_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_success_plans_updated_at ON success_plans;
CREATE TRIGGER trg_success_plans_updated_at
  BEFORE UPDATE ON success_plans
  FOR EACH ROW EXECUTE FUNCTION update_success_plans_updated_at();
