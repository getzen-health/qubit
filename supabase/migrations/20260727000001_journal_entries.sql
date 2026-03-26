-- Enhance journal_entries table with AFINN sentiment analysis, Three Good Things,
-- CBT thought records, and multi-type journaling support (issue #548)

-- Add new columns for enhanced journaling
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS sentiment_score numeric(4,2),
  ADD COLUMN IF NOT EXISTS sentiment_level text,
  ADD COLUMN IF NOT EXISTS gratitude_items jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cbt_record jsonb,
  ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mood_before integer CHECK (mood_before BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS mood_after integer CHECK (mood_after BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS date date;

-- Backfill date from entry_date
UPDATE public.journal_entries SET date = entry_date WHERE date IS NULL;

-- Drop old unique constraint to allow multiple entries per day (different types)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'journal_entries_user_id_entry_date_key'
      AND conrelid = 'public.journal_entries'::regclass
  ) THEN
    ALTER TABLE public.journal_entries DROP CONSTRAINT journal_entries_user_id_entry_date_key;
  END IF;
END;
$$;

-- Add new partial unique constraint: one entry per (user, date, type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'journal_entries_user_date_type_key'
      AND conrelid = 'public.journal_entries'::regclass
  ) THEN
    ALTER TABLE public.journal_entries
      ADD CONSTRAINT journal_entries_user_date_type_key UNIQUE (user_id, entry_date, type);
  END IF;
END;
$$;

-- Indexes for the new query patterns
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date_desc
  ON public.journal_entries(user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_type
  ON public.journal_entries(user_id, type);

CREATE INDEX IF NOT EXISTS idx_journal_entries_sentiment
  ON public.journal_entries(user_id, sentiment_level);
