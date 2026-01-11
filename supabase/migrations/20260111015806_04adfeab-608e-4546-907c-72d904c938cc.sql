-- Allow satisfaction score up to 100.0 (previously numeric(3,1) capped at 99.9)
ALTER TABLE public.customer_satisfaction
  ALTER COLUMN score TYPE numeric(4,1);

-- Optional: keep score bounded to 0..100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'customer_satisfaction'
      AND c.conname = 'customer_satisfaction_score_range'
  ) THEN
    ALTER TABLE public.customer_satisfaction
      ADD CONSTRAINT customer_satisfaction_score_range
      CHECK (score IS NULL OR (score >= 0 AND score <= 100));
  END IF;
END $$;