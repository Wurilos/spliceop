-- Add time fields to mileage_records table
ALTER TABLE public.mileage_records
ADD COLUMN IF NOT EXISTS start_time time WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time time WITHOUT TIME ZONE;