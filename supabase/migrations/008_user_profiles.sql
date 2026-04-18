-- User profiles: vincula usuarios con organizaciones
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_org_id ON user_profiles(org_id);

-- RLS: usuario solo puede leer su propio profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Service role can manage profiles"
  ON user_profiles FOR ALL
  USING (true)
  WITH CHECK (true);
