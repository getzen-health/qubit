CREATE TABLE IF NOT EXISTS public.ecg_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at     TIMESTAMPTZ NOT NULL,
  classification  TEXT NOT NULL,  -- sinusRhythm, atrialFibrillation, inconclusiveLowHR, inconclusiveHighHR, inconclusiveOther, unrecognized
  average_hr_bpm  INTEGER,
  sampling_frequency_hz NUMERIC(6,1),
  lead            TEXT DEFAULT 'leadI',
  symptoms_status TEXT,           -- none, notSet, etc
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ecg_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own ECG" ON public.ecg_records FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_ecg_user_date ON public.ecg_records(user_id, recorded_at DESC);
CREATE UNIQUE INDEX idx_ecg_unique ON public.ecg_records(user_id, recorded_at);
