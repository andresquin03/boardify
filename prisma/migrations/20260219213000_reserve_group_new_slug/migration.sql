-- Reserve group slug "new" because /groups/new is a static route.
-- If an existing group currently uses "new", move it to the first available "new_N" slug.

DO $$
DECLARE
  replacement_slug TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "Group" WHERE "slug" = 'new') THEN
    SELECT 'new_' || gs.n::text
      INTO replacement_slug
    FROM generate_series(2, 1000) AS gs(n)
    WHERE NOT EXISTS (
      SELECT 1 FROM "Group" g WHERE g."slug" = 'new_' || gs.n::text
    )
    AND NOT EXISTS (
      SELECT 1 FROM "GroupSlug" s WHERE s."slug" = 'new_' || gs.n::text
    )
    ORDER BY gs.n
    LIMIT 1;

    IF replacement_slug IS NULL THEN
      RAISE EXCEPTION 'Could not allocate a replacement slug for reserved slug "new"';
    END IF;

    UPDATE "Group"
      SET "slug" = replacement_slug
      WHERE "slug" = 'new';
  END IF;
END
$$;
