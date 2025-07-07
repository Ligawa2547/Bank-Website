-- Adds profile_pic column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_pic'
  ) THEN
    ALTER TABLE users
      ADD COLUMN profile_pic TEXT;
  END IF;
END $$;
