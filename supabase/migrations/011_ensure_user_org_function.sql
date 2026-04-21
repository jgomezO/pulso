-- Atomic function to ensure a user has exactly one organization.
-- Prevents race conditions where concurrent calls create duplicate orgs.
CREATE OR REPLACE FUNCTION ensure_user_org(
  p_user_id UUID,
  p_org_name TEXT,
  p_org_slug TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_orphan_org_id UUID;
BEGIN
  -- Check if user already has a profile
  SELECT org_id INTO v_org_id
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_org_id IS NOT NULL THEN
    RETURN json_build_object('org_id', v_org_id, 'is_new', false);
  END IF;

  -- Create org + profile in a single transaction
  INSERT INTO organizations (name, slug) VALUES (p_org_name, p_org_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO user_profiles (id, org_id, role) VALUES (p_user_id, v_org_id, 'admin')
  ON CONFLICT (id) DO NOTHING;

  -- If ON CONFLICT hit, another concurrent request already created the profile
  IF NOT FOUND THEN
    -- Save the org we just created so we can delete it
    v_orphan_org_id := v_org_id;
    -- Fetch the org that the winning request assigned
    SELECT org_id INTO v_org_id FROM user_profiles WHERE id = p_user_id;
    -- Clean up the orphaned org
    DELETE FROM organizations WHERE id = v_orphan_org_id;
    RETURN json_build_object('org_id', v_org_id, 'is_new', false);
  END IF;

  RETURN json_build_object('org_id', v_org_id, 'is_new', true);
END;
$$;
