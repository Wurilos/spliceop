-- Allow null values for installation_date column in seals table
ALTER TABLE public.seals ALTER COLUMN installation_date DROP NOT NULL;