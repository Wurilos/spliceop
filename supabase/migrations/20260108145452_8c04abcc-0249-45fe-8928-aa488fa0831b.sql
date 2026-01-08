
-- Create table for seal service orders
CREATE TABLE public.seal_service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  contract_id UUID REFERENCES public.contracts(id),
  equipment_id UUID REFERENCES public.equipment(id),
  maintenance_description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for seal service order items (installed seals)
CREATE TABLE public.seal_service_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.seal_service_orders(id) ON DELETE CASCADE,
  seal_id UUID NOT NULL REFERENCES public.seals(id),
  installation_item TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seal_service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seal_service_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for seal_service_orders
CREATE POLICY "Authenticated users can view seal_service_orders" 
ON public.seal_service_orders FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert seal_service_orders" 
ON public.seal_service_orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update seal_service_orders" 
ON public.seal_service_orders FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete seal_service_orders" 
ON public.seal_service_orders FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for seal_service_order_items
CREATE POLICY "Authenticated users can view seal_service_order_items" 
ON public.seal_service_order_items FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert seal_service_order_items" 
ON public.seal_service_order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update seal_service_order_items" 
ON public.seal_service_order_items FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete seal_service_order_items" 
ON public.seal_service_order_items FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_seal_service_orders_updated_at
BEFORE UPDATE ON public.seal_service_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
