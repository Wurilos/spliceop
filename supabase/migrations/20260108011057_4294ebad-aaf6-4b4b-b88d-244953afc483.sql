-- Create table for Kanban columns configuration
CREATE TABLE public.kanban_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  color TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Kanban columns are viewable by authenticated users" 
ON public.kanban_columns 
FOR SELECT 
USING (public.is_authenticated());

CREATE POLICY "Kanban columns can be managed by authenticated users" 
ON public.kanban_columns 
FOR ALL 
USING (public.is_authenticated());

-- Add trigger for updated_at
CREATE TRIGGER update_kanban_columns_updated_at
BEFORE UPDATE ON public.kanban_columns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default columns based on the reference image
INSERT INTO public.kanban_columns (key, title, order_index, is_active, color) VALUES
('energia', 'Energia', 1, true, NULL),
('internet', 'Internet', 2, true, NULL),
('infraestrutura', 'Aguardando Infraestrutura', 3, true, NULL),
('aguardando', 'Aguardando Material / Terceiros', 4, true, 'yellow'),
('afericao', 'Aferição', 5, true, NULL),
('manutencao_veicular', 'Manutenção Veicular', 6, true, NULL),
('clientes', 'Cliente:', 7, true, NULL),
('pronto', 'Pronto para Executar', 8, false, NULL);

-- Add column_key to pending_issues for kanban integration
ALTER TABLE public.pending_issues ADD COLUMN IF NOT EXISTS column_key TEXT DEFAULT 'energia';
ALTER TABLE public.pending_issues ADD COLUMN IF NOT EXISTS type TEXT DEFAULT NULL;
ALTER TABLE public.pending_issues ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;
ALTER TABLE public.pending_issues ADD COLUMN IF NOT EXISTS team TEXT DEFAULT NULL;
ALTER TABLE public.pending_issues ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL;