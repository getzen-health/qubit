-- Prevent duplicate water logs for same user+time
ALTER TABLE water_logs ADD CONSTRAINT water_logs_user_time_unique 
  UNIQUE (user_id, logged_at);

-- Prevent overlapping fasting sessions
ALTER TABLE fasting_sessions ADD CONSTRAINT fasting_sessions_user_start_unique 
  UNIQUE (user_id, started_at);
