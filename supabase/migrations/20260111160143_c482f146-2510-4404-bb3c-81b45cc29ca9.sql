-- Create chip_numbers table for registering chips (only line_number and carrier)
CREATE TABLE public.chip_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_number VARCHAR(50) NOT NULL UNIQUE,
  carrier VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for line number search
CREATE INDEX idx_chip_numbers_line ON public.chip_numbers(line_number);

-- Enable RLS
ALTER TABLE public.chip_numbers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can view chip_numbers"
ON public.chip_numbers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert chip_numbers"
ON public.chip_numbers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update chip_numbers"
ON public.chip_numbers FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete chip_numbers"
ON public.chip_numbers FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_chip_numbers_updated_at
BEFORE UPDATE ON public.chip_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Alter phone_lines to reference chip_numbers instead of storing line directly
-- First add the foreign key column
ALTER TABLE public.phone_lines
ADD COLUMN chip_id UUID REFERENCES public.chip_numbers(id);