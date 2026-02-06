-- Create EPI items table (item registry)
CREATE TABLE public.epi_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create EPI receipts table (item entries)
CREATE TABLE public.epi_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.epi_items(id) ON DELETE CASCADE,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create EPI outputs table (item distributions)
CREATE TABLE public.epi_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.epi_items(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  output_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.epi_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for epi_items
CREATE POLICY "Authenticated users can view EPI items" ON public.epi_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert EPI items" ON public.epi_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update EPI items" ON public.epi_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete EPI items" ON public.epi_items
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for epi_receipts
CREATE POLICY "Authenticated users can view EPI receipts" ON public.epi_receipts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert EPI receipts" ON public.epi_receipts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update EPI receipts" ON public.epi_receipts
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete EPI receipts" ON public.epi_receipts
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for epi_outputs
CREATE POLICY "Authenticated users can view EPI outputs" ON public.epi_outputs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert EPI outputs" ON public.epi_outputs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update EPI outputs" ON public.epi_outputs
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete EPI outputs" ON public.epi_outputs
  FOR DELETE TO authenticated USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_epi_items_updated_at
  BEFORE UPDATE ON public.epi_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epi_receipts_updated_at
  BEFORE UPDATE ON public.epi_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epi_outputs_updated_at
  BEFORE UPDATE ON public.epi_outputs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for EPI photos
INSERT INTO storage.buckets (id, name, public) VALUES ('epi-photos', 'epi-photos', true);

-- Storage policies for EPI photos
CREATE POLICY "Public can view EPI photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'epi-photos');

CREATE POLICY "Authenticated users can upload EPI photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'epi-photos');

CREATE POLICY "Authenticated users can update EPI photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'epi-photos');

CREATE POLICY "Authenticated users can delete EPI photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'epi-photos');

-- Create indexes for performance
CREATE INDEX idx_epi_receipts_item_id ON public.epi_receipts(item_id);
CREATE INDEX idx_epi_receipts_receipt_date ON public.epi_receipts(receipt_date);
CREATE INDEX idx_epi_outputs_item_id ON public.epi_outputs(item_id);
CREATE INDEX idx_epi_outputs_employee_id ON public.epi_outputs(employee_id);
CREATE INDEX idx_epi_outputs_output_date ON public.epi_outputs(output_date);