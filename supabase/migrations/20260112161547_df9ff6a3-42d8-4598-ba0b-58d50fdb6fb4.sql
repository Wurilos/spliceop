-- Remove the date column from infractions table
ALTER TABLE public.infractions DROP COLUMN IF EXISTS date;