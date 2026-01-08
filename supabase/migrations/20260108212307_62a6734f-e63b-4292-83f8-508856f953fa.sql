-- Add new columns to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS fuel_type text,
ADD COLUMN IF NOT EXISTS current_km integer,
ADD COLUMN IF NOT EXISTS availability_date date,
ADD COLUMN IF NOT EXISTS monthly_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tag_number text,
ADD COLUMN IF NOT EXISTS insurance_company text,
ADD COLUMN IF NOT EXISTS rental_company text,
ADD COLUMN IF NOT EXISTS insurance_contact text,
ADD COLUMN IF NOT EXISTS notes text;