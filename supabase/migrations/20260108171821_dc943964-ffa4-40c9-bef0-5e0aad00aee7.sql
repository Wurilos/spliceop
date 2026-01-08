-- Add monthly_value column to invoices table
ALTER TABLE public.invoices ADD COLUMN monthly_value numeric DEFAULT 0;