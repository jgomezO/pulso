-- Enable RLS on tables that were missing it

-- success_plans: isolated via account_id → accounts.org_id
ALTER TABLE success_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_isolation_success_plans" ON success_plans;

CREATE POLICY "org_isolation_success_plans" ON success_plans
  USING (account_id IN (
    SELECT id FROM accounts
    WHERE org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID
  ));

-- plan_milestones: isolated via plan_id → success_plans → accounts.org_id
ALTER TABLE plan_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_isolation_plan_milestones" ON plan_milestones;

CREATE POLICY "org_isolation_plan_milestones" ON plan_milestones
  USING (plan_id IN (
    SELECT sp.id FROM success_plans sp
    JOIN accounts a ON a.id = sp.account_id
    WHERE a.org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID
  ));

-- health_score_configs: isolated via org_id directly
ALTER TABLE health_score_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_isolation_health_score_configs" ON health_score_configs;

CREATE POLICY "org_isolation_health_score_configs" ON health_score_configs
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID);

-- account_signal_values: isolated via account_id → accounts.org_id
ALTER TABLE account_signal_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_isolation_account_signal_values" ON account_signal_values;

CREATE POLICY "org_isolation_account_signal_values" ON account_signal_values
  USING (account_id IN (
    SELECT id FROM accounts
    WHERE org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID
  ));
