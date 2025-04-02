-- Fix the achievements table schema by ensuring all required columns exist
DO $$ 
BEGIN
    -- Add icon_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'icon_url'
    ) THEN
        ALTER TABLE "achievements" ADD COLUMN "icon_url" text;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE "achievements" ADD COLUMN "created_at" timestamp DEFAULT now();
    END IF;

    -- Update any existing achievements that have NULL values for these columns
    UPDATE "achievements"
    SET "icon_url" = ''
    WHERE "icon_url" IS NULL;

    UPDATE "achievements"
    SET "created_at" = now()
    WHERE "created_at" IS NULL;
END $$; 