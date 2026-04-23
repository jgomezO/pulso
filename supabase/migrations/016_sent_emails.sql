CREATE TABLE sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  sent_by UUID NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  resend_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sent_emails_account ON sent_emails(account_id, created_at DESC);
CREATE INDEX idx_sent_emails_status ON sent_emails(status) WHERE status = 'failed';

ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_sent_emails" ON sent_emails
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::UUID);

CREATE TRIGGER update_sent_emails_updated_at
  BEFORE UPDATE ON sent_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
