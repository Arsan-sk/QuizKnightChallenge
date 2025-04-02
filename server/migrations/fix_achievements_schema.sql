-- Add icon_url column to achievements table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'icon_url'
    ) THEN
        ALTER TABLE "achievements" ADD COLUMN "icon_url" text;
    END IF;
END $$; 