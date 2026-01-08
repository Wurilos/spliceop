
-- Add new columns for the seal receiving module
ALTER TABLE public.seals 
  ADD COLUMN IF NOT EXISTS seal_type TEXT,
  ADD COLUMN IF NOT EXISTS received_date DATE,
  ADD COLUMN IF NOT EXISTS memo_number TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';

-- Make equipment_id nullable since received seals don't have equipment yet
ALTER TABLE public.seals 
  ALTER COLUMN equipment_id DROP NOT NULL;

-- Update existing records to have a status
UPDATE public.seals SET status = 'installed' WHERE equipment_id IS NOT NULL AND status = 'available';
