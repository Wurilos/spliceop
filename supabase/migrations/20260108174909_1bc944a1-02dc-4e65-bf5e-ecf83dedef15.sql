-- Create energy_suppliers table
CREATE TABLE public.energy_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.energy_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies for energy_suppliers
CREATE POLICY "Authenticated users can view energy_suppliers" 
ON public.energy_suppliers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert energy_suppliers" 
ON public.energy_suppliers FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update energy_suppliers" 
ON public.energy_suppliers FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete energy_suppliers" 
ON public.energy_suppliers FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create energy_consumer_units table
CREATE TABLE public.energy_consumer_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.energy_suppliers(id),
  consumer_unit TEXT NOT NULL,
  contract_id UUID,
  equipment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.energy_consumer_units ENABLE ROW LEVEL SECURITY;

-- RLS policies for energy_consumer_units
CREATE POLICY "Authenticated users can view energy_consumer_units" 
ON public.energy_consumer_units FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert energy_consumer_units" 
ON public.energy_consumer_units FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update energy_consumer_units" 
ON public.energy_consumer_units FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete energy_consumer_units" 
ON public.energy_consumer_units FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add supplier_id to energy_bills table
ALTER TABLE public.energy_bills ADD COLUMN supplier_id UUID REFERENCES public.energy_suppliers(id);
ALTER TABLE public.energy_bills ADD COLUMN equipment_id UUID;

-- Remove consumption_kwh column
ALTER TABLE public.energy_bills DROP COLUMN IF EXISTS consumption_kwh;

-- Create updated_at triggers
CREATE TRIGGER update_energy_suppliers_updated_at
BEFORE UPDATE ON public.energy_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_energy_consumer_units_updated_at
BEFORE UPDATE ON public.energy_consumer_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();