-- Travel Health: trips, vaccinations
-- Migration: 20260814000001_travel_health

CREATE TABLE travel_trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination_country text NOT NULL,
  destination_city text,
  departure_date date NOT NULL,
  return_date date,
  departure_timezone text,
  arrival_timezone text,
  max_altitude_m integer DEFAULT 0,
  activities jsonb DEFAULT '[]',
  health_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE travel_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trips"
  ON travel_trips FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_travel_trips_user
  ON travel_trips(user_id, departure_date DESC);

CREATE TABLE travel_vaccinations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vaccine_name text NOT NULL,
  dose_number integer DEFAULT 1,
  date_given date NOT NULL,
  expiry_date date,
  provider text,
  lot_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE travel_vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vaccinations"
  ON travel_vaccinations FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_travel_vaccinations_user
  ON travel_vaccinations(user_id, date_given DESC);
