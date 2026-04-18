-- Migration: Add industry, contract_start_date, archived_at, csm_notes to accounts
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS industry TEXT CHECK (industry IN ('saas', 'fintech', 'ecommerce', 'healthtech', 'other')),
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS csm_notes TEXT;

-- Update tier constraint to include 'other'
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_tier_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_tier_check
  CHECK (tier IN ('enterprise', 'growth', 'starter', 'other'));
