-- DocFlow - RPC: atomically set "main" organization for the current user

-- Ensures that for a given user (auth.uid()):
--  1) all organizations have is_main = false
--  2) the selected organization has is_main = true
-- in one transaction, so there is no race between two separate UPDATEs.

CREATE OR REPLACE FUNCTION public.set_organization_main(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Guard: refuse to switch if organization doesn't belong to the caller.
  IF NOT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = p_org_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- 1) unset all main flags for this user
  UPDATE public.organizations
  SET is_main = false
  WHERE user_id = auth.uid();

  -- 2) set the chosen one as main
  UPDATE public.organizations
  SET is_main = true
  WHERE id = p_org_id
    AND user_id = auth.uid();
END;
$$;

