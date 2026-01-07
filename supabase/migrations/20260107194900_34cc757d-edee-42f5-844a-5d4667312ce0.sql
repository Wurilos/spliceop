-- Create infrastructure_services table
CREATE TABLE public.infrastructure_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id),
  serial_number TEXT NOT NULL,
  municipality TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.infrastructure_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view infrastructure_services"
  ON public.infrastructure_services FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert infrastructure_services"
  ON public.infrastructure_services FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update infrastructure_services"
  ON public.infrastructure_services FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete infrastructure_services"
  ON public.infrastructure_services FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_infrastructure_services_updated_at
  BEFORE UPDATE ON public.infrastructure_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();