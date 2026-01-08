
-- Create internet_providers table
CREATE TABLE public.internet_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create internet_connections table
CREATE TABLE public.internet_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id),
  serial_number TEXT NOT NULL,
  provider_id UUID REFERENCES public.internet_providers(id),
  client_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add provider_id to internet_bills for linking
ALTER TABLE public.internet_bills 
ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.internet_connections(id);

-- Enable RLS
ALTER TABLE public.internet_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internet_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for internet_providers
CREATE POLICY "Authenticated users can view internet_providers" ON public.internet_providers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert internet_providers" ON public.internet_providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update internet_providers" ON public.internet_providers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete internet_providers" ON public.internet_providers FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for internet_connections
CREATE POLICY "Authenticated users can view internet_connections" ON public.internet_connections FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert internet_connections" ON public.internet_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update internet_connections" ON public.internet_connections FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete internet_connections" ON public.internet_connections FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_internet_providers_updated_at
  BEFORE UPDATE ON public.internet_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internet_connections_updated_at
  BEFORE UPDATE ON public.internet_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
