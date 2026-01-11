-- Add ownership column to vehicles table
ALTER TABLE public.vehicles ADD COLUMN ownership text DEFAULT 'Próprio';