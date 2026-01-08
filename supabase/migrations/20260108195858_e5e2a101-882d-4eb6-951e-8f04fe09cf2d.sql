-- Create components table (catalog of component types)
CREATE TABLE public.components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stock table (stock items by contract)
CREATE TABLE public.stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id),
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stock_maintenance table (maintenance records)
CREATE TABLE public.stock_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id),
  om_number TEXT NOT NULL,
  nf_number TEXT NOT NULL,
  send_date DATE NOT NULL,
  return_date DATE,
  return_nf TEXT,
  observations TEXT,
  status TEXT DEFAULT 'em_manutencao',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create stock_maintenance_items table (components in maintenance)
CREATE TABLE public.stock_maintenance_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_id UUID NOT NULL REFERENCES public.stock_maintenance(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES public.components(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_maintenance_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for components
CREATE POLICY "Authenticated users can view components" ON public.components FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Authenticated users can insert components" ON public.components FOR INSERT WITH CHECK (public.is_authenticated());
CREATE POLICY "Authenticated users can update components" ON public.components FOR UPDATE USING (public.is_authenticated());
CREATE POLICY "Authenticated users can delete components" ON public.components FOR DELETE USING (public.is_authenticated());

-- RLS Policies for stock
CREATE POLICY "Authenticated users can view stock" ON public.stock FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Authenticated users can insert stock" ON public.stock FOR INSERT WITH CHECK (public.is_authenticated());
CREATE POLICY "Authenticated users can update stock" ON public.stock FOR UPDATE USING (public.is_authenticated());
CREATE POLICY "Authenticated users can delete stock" ON public.stock FOR DELETE USING (public.is_authenticated());

-- RLS Policies for stock_maintenance
CREATE POLICY "Authenticated users can view stock_maintenance" ON public.stock_maintenance FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Authenticated users can insert stock_maintenance" ON public.stock_maintenance FOR INSERT WITH CHECK (public.is_authenticated());
CREATE POLICY "Authenticated users can update stock_maintenance" ON public.stock_maintenance FOR UPDATE USING (public.is_authenticated());
CREATE POLICY "Authenticated users can delete stock_maintenance" ON public.stock_maintenance FOR DELETE USING (public.is_authenticated());

-- RLS Policies for stock_maintenance_items
CREATE POLICY "Authenticated users can view stock_maintenance_items" ON public.stock_maintenance_items FOR SELECT USING (public.is_authenticated());
CREATE POLICY "Authenticated users can insert stock_maintenance_items" ON public.stock_maintenance_items FOR INSERT WITH CHECK (public.is_authenticated());
CREATE POLICY "Authenticated users can update stock_maintenance_items" ON public.stock_maintenance_items FOR UPDATE USING (public.is_authenticated());
CREATE POLICY "Authenticated users can delete stock_maintenance_items" ON public.stock_maintenance_items FOR DELETE USING (public.is_authenticated());

-- Triggers for updated_at
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON public.components FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON public.stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_maintenance_updated_at BEFORE UPDATE ON public.stock_maintenance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();