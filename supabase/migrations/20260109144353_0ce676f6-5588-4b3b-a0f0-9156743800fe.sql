-- Add cost_center column to contracts table
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS cost_center TEXT;