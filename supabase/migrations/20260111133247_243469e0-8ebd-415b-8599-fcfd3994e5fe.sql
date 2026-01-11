-- Add code and value columns, rename category to type
ALTER TABLE public.components
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS value numeric;

-- Rename category to type if category exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'category') THEN
    ALTER TABLE public.components RENAME COLUMN category TO type;
  END IF;
END $$;