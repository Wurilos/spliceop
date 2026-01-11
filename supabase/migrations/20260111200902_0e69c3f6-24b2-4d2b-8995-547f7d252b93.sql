-- Add zero_invoice column to energy_bills table
ALTER TABLE public.energy_bills ADD COLUMN zero_invoice boolean DEFAULT false;