-- Pain Science Education & Chronic Pain Management Logs
-- Supports biopsychosocial model tracking, TSK-4, CSI-9, PCS-3 instruments

CREATE TABLE IF NOT EXISTS public.pain_science_logs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                      DATE NOT NULL,

  -- NRS Pain Level 0-10
  pain_level                SMALLINT NOT NULL CHECK (pain_level BETWEEN 0 AND 10),

  -- Body regions and quality
  pain_locations            TEXT[] NOT NULL DEFAULT '{}',
  pain_quality              TEXT[] NOT NULL DEFAULT '{}',

  -- Biopsychosocial contributors 1-10
  biological_contributors   SMALLINT NOT NULL DEFAULT 5 CHECK (biological_contributors BETWEEN 1 AND 10),
  psychological_contributors SMALLINT NOT NULL DEFAULT 5 CHECK (psychological_contributors BETWEEN 1 AND 10),
  social_contributors       SMALLINT NOT NULL DEFAULT 5 CHECK (social_contributors BETWEEN 1 AND 10),

  -- PCS-3 catastrophizing subscale (0-4 each)
  pcs_rumination            SMALLINT NOT NULL DEFAULT 0 CHECK (pcs_rumination BETWEEN 0 AND 4),
  pcs_magnification         SMALLINT NOT NULL DEFAULT 0 CHECK (pcs_magnification BETWEEN 0 AND 4),
  pcs_helplessness          SMALLINT NOT NULL DEFAULT 0 CHECK (pcs_helplessness BETWEEN 0 AND 4),

  -- TSK-4 Tampa Scale of Kinesiophobia short form (1-4 each)
  tsk_q1                    SMALLINT NOT NULL DEFAULT 1 CHECK (tsk_q1 BETWEEN 1 AND 4),
  tsk_q2                    SMALLINT NOT NULL DEFAULT 1 CHECK (tsk_q2 BETWEEN 1 AND 4),
  tsk_q3                    SMALLINT NOT NULL DEFAULT 1 CHECK (tsk_q3 BETWEEN 1 AND 4),
  tsk_q4                    SMALLINT NOT NULL DEFAULT 1 CHECK (tsk_q4 BETWEEN 1 AND 4),

  -- CSI-9 Central Sensitization Inventory short form (9 values 0-4)
  csi_symptoms              SMALLINT[] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0}',

  -- Activity tracking
  movement_today            BOOLEAN NOT NULL DEFAULT FALSE,
  movement_minutes          SMALLINT NOT NULL DEFAULT 0,
  avoided_activities        TEXT[] NOT NULL DEFAULT '{}',
  helpful_strategies        TEXT[] NOT NULL DEFAULT '{}',

  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.pain_science_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own pain science logs"
  ON public.pain_science_logs
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_pain_science_user_date
  ON public.pain_science_logs (user_id, date DESC);

CREATE UNIQUE INDEX idx_pain_science_user_date_unique
  ON public.pain_science_logs (user_id, date);
