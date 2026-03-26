CREATE TABLE IF NOT EXISTS coach_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid DEFAULT gen_random_uuid() NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_coach_conv_user_session ON coach_conversations(user_id, session_id, created_at);

ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations" ON coach_conversations
  FOR ALL USING (auth.uid() = user_id);
