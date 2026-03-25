-- strength_sets already has RLS enabled and a basic policy that checks user_id directly.
-- This migration replaces it with a stricter policy that validates ownership via the
-- strength_sessions parent table, preventing any bypass through direct user_id manipulation.

DROP POLICY IF EXISTS "Users can manage own strength sets" ON strength_sets;

ALTER TABLE strength_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own strength sets"
  ON strength_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM strength_sessions ss
      WHERE ss.id = strength_sets.session_id
        AND ss.user_id = auth.uid()
    )
  );
