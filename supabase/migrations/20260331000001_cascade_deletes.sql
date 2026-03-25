-- Ensure ON DELETE CASCADE on foreign keys from auth.users to all user data tables
-- that were created without it in 20260324000001_add_ai_tables.sql

ALTER TABLE briefings
  DROP CONSTRAINT IF EXISTS briefings_user_id_fkey,
  ADD CONSTRAINT briefings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE anomalies
  DROP CONSTRAINT IF EXISTS anomalies_user_id_fkey,
  ADD CONSTRAINT anomalies_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey,
  ADD CONSTRAINT chat_messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE predictions
  DROP CONSTRAINT IF EXISTS predictions_user_id_fkey,
  ADD CONSTRAINT predictions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
