-- Add status column to phone_lines table
ALTER TABLE public.phone_lines 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
