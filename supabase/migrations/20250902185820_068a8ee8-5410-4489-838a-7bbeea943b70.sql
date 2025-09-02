-- 1) Add 'chicken_run' to enum game_type if missing (fixes invalid enum error)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'game_type' AND e.enumlabel = 'chicken_run'
  ) THEN
    ALTER TYPE game_type ADD VALUE 'chicken_run';
  END IF;
END $$;

-- 2) Add FK to enable PostgREST relationship for leaderboard -> profiles used in UI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chicken_run_leaderboard_user_id_fkey'
  ) THEN
    ALTER TABLE public.chicken_run_leaderboard
      ADD CONSTRAINT chicken_run_leaderboard_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;