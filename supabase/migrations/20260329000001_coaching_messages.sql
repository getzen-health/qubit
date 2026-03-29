CREATE TABLE coaching_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_messages" ON coaching_messages
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_coaching_messages_user_session ON coaching_messages(user_id, session_id, created_at DESC);
