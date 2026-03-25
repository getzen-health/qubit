-- Fix overly-restrictive RLS policy on challenge_participants to allow leaderboard views
-- Drop the restrictive policy that only allowed users to see their own participation
DROP POLICY IF EXISTS "Participants see own data" ON challenge_participants;

-- Allow users to read ALL participants in challenges they belong to (for leaderboard)
CREATE POLICY "Participants can view challenge members"
ON challenge_participants FOR SELECT TO authenticated
USING (
  challenge_id IN (
    SELECT challenge_id FROM challenge_participants
    WHERE user_id = auth.uid()
  )
);

-- Users can only insert their own participation
CREATE POLICY "Users manage own participation"
ON challenge_participants FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can only update their own participation
CREATE POLICY "Users update own participation"
ON challenge_participants FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Users can only delete their own participation
CREATE POLICY "Users delete own participation"
ON challenge_participants FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Also fix challenges table to allow participants to read challenges they're enrolled in
DROP POLICY IF EXISTS "Anyone can read challenges" ON challenges;
DROP POLICY IF EXISTS "Creators manage own challenges" ON challenges;

-- Participants can read challenges they're enrolled in, creators can read their own
CREATE POLICY "Participants can read joined challenges"
ON challenges FOR SELECT TO authenticated
USING (
  id IN (SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid())
  OR creator_id = auth.uid()
);

-- Creators manage their own challenges
CREATE POLICY "Creators manage own challenges"
ON challenges FOR ALL TO authenticated
USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
