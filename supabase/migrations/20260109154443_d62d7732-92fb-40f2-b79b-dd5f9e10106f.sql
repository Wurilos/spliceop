-- Add new columns to employees table based on spreadsheet fields
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS ctps TEXT,
ADD COLUMN IF NOT EXISTS ctps_serie TEXT,
ADD COLUMN IF NOT EXISTS termination_date DATE,
ADD COLUMN IF NOT EXISTS re TEXT;