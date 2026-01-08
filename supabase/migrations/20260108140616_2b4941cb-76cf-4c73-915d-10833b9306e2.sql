
-- Create phone_lines table for managing phone lines/chips in equipment
CREATE TABLE public.phone_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id),
  equipment_id UUID REFERENCES public.equipment(id),
  line_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  sub_carrier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_lines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view phone_lines" 
ON public.phone_lines FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert phone_lines" 
ON public.phone_lines FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update phone_lines" 
ON public.phone_lines FOR UPDATE 
USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete phone_lines" 
ON public.phone_lines FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_phone_lines_updated_at
BEFORE UPDATE ON public.phone_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
