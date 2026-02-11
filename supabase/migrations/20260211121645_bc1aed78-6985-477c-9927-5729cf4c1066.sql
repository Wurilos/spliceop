
ALTER TABLE public.chip_numbers
ADD COLUMN sub_carrier text,
ADD COLUMN status text NOT NULL DEFAULT 'active';
