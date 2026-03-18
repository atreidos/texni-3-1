-- DocFlow - enforce single main organization per user
-- Ensures that each user_id has at most one organization with is_main = true.

-- If data already has multiple main organizations for a user,
-- keep the most recently updated/created and unset the rest.
WITH ranked AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC, created_at DESC
    ) AS rn
  FROM public.organizations
  WHERE is_main = true
)
UPDATE public.organizations o
SET is_main = false
FROM ranked r
WHERE o.id = r.id
  AND r.rn > 1;

-- Enforce: one main organization per user.
CREATE UNIQUE INDEX IF NOT EXISTS organizations_one_main_per_user
  ON public.organizations (user_id)
  WHERE is_main = true;

