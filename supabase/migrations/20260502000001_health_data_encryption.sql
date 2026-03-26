-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted_note column to health_annotations for symmetric encryption
ALTER TABLE public.health_annotations
ADD COLUMN IF NOT EXISTS encrypted_note BYTEA,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Create helper function to encrypt health notes
CREATE OR REPLACE FUNCTION encrypt_health_note(note_text TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
  IF note_text IS NULL OR encryption_key IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_encrypt(note_text, encryption_key);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create helper function to decrypt health notes
CREATE OR REPLACE FUNCTION decrypt_health_note(encrypted_data BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  IF encrypted_data IS NULL OR encryption_key IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(encrypted_data, encryption_key);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Migrate existing plaintext notes to encrypted format (when encryption key is available)
-- This will be run by application code during deployment
-- After migration, we can deprecate the 'note' column and use 'encrypted_note' exclusively

-- Create index on encrypted_note for performance if needed
CREATE INDEX IF NOT EXISTS idx_health_annotations_encrypted ON public.health_annotations(id) 
WHERE is_encrypted = true;
