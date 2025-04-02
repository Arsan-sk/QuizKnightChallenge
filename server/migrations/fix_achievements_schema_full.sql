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

    -- Add iconUrl column if it doesn't exist (to handle camelCase)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'iconUrl'
    ) THEN
        ALTER TABLE "achievements" ADD COLUMN "iconUrl" text;
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

    -- Add createdAt column if it doesn't exist (to handle camelCase)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "achievements" ADD COLUMN "createdAt" timestamp DEFAULT now();
    END IF;

    -- Update any existing achievements that have NULL values for these columns
    UPDATE "achievements"
    SET "icon_url" = ''
    WHERE "icon_url" IS NULL;

    UPDATE "achievements"
    SET "iconUrl" = ''
    WHERE "iconUrl" IS NULL;

    UPDATE "achievements"
    SET "created_at" = now()
    WHERE "created_at" IS NULL;

    UPDATE "achievements"
    SET "createdAt" = now()
    WHERE "createdAt" IS NULL;

    -- Copy values between snake_case and camelCase versions
    UPDATE "achievements"
    SET "iconUrl" = "icon_url"
    WHERE "icon_url" IS NOT NULL AND "iconUrl" IS NULL;

    UPDATE "achievements"
    SET "icon_url" = "iconUrl"
    WHERE "iconUrl" IS NOT NULL AND "icon_url" IS NULL;

    UPDATE "achievements"
    SET "createdAt" = "created_at"
    WHERE "created_at" IS NOT NULL AND "createdAt" IS NULL;

    UPDATE "achievements"
    SET "created_at" = "createdAt"
    WHERE "createdAt" IS NOT NULL AND "created_at" IS NULL;
END $$; 