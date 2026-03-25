-- Performance indexes for high-traffic tables
-- Tables added in: 20260324000001_add_ai_tables.sql

-- predictions: queried per-user ordered by created_at
CREATE INDEX IF NOT EXISTS predictions_user_date_idx
  ON predictions(user_id, created_at DESC);

-- briefings: queried per-user ordered by date
CREATE INDEX IF NOT EXISTS briefings_user_date_idx
  ON briefings(user_id, date DESC);

-- chat_messages: queried per-user ordered by created_at
CREATE INDEX IF NOT EXISTS chat_messages_user_date_idx
  ON chat_messages(user_id, created_at DESC);

-- health_records: already has (user_id, type) and (user_id, start_time DESC) indexes;
-- add composite covering user_id + type + start_time for filtered time-range queries
CREATE INDEX IF NOT EXISTS health_records_user_type_date_idx
  ON health_records(user_id, type, start_time DESC);
