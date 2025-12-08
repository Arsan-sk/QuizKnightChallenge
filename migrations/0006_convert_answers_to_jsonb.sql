-- Convert or create answers column as jsonb for robust storage of submitted answers
DO $$ BEGIN
  -- Add column if missing (jsonb)
  ALTER TABLE results ADD COLUMN IF NOT EXISTS answers jsonb;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Initialize missing answers to empty array
UPDATE results SET answers = '[]'::jsonb WHERE answers IS NULL OR answers = '';

-- Try to alter existing column type to jsonb if it's not jsonb
DO $$ BEGIN
  BEGIN
    ALTER TABLE results ALTER COLUMN answers TYPE jsonb USING (answers::jsonb);
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not alter answers column to jsonb: %', SQLERRM;
  END;
END $$;
