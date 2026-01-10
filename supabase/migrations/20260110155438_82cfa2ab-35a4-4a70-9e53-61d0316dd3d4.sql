-- Tabela para armazenar os subitens (substatus) de cada tipo de demanda
CREATE TABLE public.kanban_subitems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID NOT NULL REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_subitems ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Authenticated users can view kanban subitems"
ON public.kanban_subitems
FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert kanban subitems"
ON public.kanban_subitems
FOR INSERT
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update kanban subitems"
ON public.kanban_subitems
FOR UPDATE
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete kanban subitems"
ON public.kanban_subitems
FOR DELETE
USING (public.is_authenticated());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_kanban_subitems_updated_at
BEFORE UPDATE ON public.kanban_subitems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir subitens padrão para os tipos existentes

-- Obter IDs das colunas existentes e inserir subitens
DO $$
DECLARE
  afericao_id UUID;
  energia_id UUID;
  internet_id UUID;
  infraestrutura_id UUID;
  manutencao_veicular_id UUID;
BEGIN
  -- Buscar IDs das colunas por título
  SELECT id INTO afericao_id FROM kanban_columns WHERE title = 'Aferição' LIMIT 1;
  SELECT id INTO energia_id FROM kanban_columns WHERE title = 'Energia' LIMIT 1;
  SELECT id INTO internet_id FROM kanban_columns WHERE title = 'Internet' LIMIT 1;
  SELECT id INTO infraestrutura_id FROM kanban_columns WHERE title = 'Infraestrutura' LIMIT 1;
  SELECT id INTO manutencao_veicular_id FROM kanban_columns WHERE title = 'Manutenção Veicular' LIMIT 1;

  -- Subitens para Aferição
  IF afericao_id IS NOT NULL THEN
    INSERT INTO kanban_subitems (column_id, title, order_index) VALUES
      (afericao_id, 'Rompimento de Lacres', 1),
      (afericao_id, 'Aguardando lacres', 2),
      (afericao_id, 'Fechamento de O.S', 3),
      (afericao_id, 'Aguardando GRU', 4),
      (afericao_id, 'Aguardando pagamento de GRU', 5),
      (afericao_id, 'Aguardando data de aferição', 6);
  END IF;

  -- Subitens para Energia
  IF energia_id IS NOT NULL THEN
    INSERT INTO kanban_subitems (column_id, title, order_index) VALUES
      (energia_id, 'Conjunta com fornecedor', 1),
      (energia_id, 'Falta de pagamento', 2),
      (energia_id, 'Vandalismo', 3),
      (energia_id, 'Pausa temporária', 4);
  END IF;

  -- Subitens para Internet
  IF internet_id IS NOT NULL THEN
    INSERT INTO kanban_subitems (column_id, title, order_index) VALUES
      (internet_id, 'Conjunta com fornecedor', 1),
      (internet_id, 'Falta de pagamento', 2),
      (internet_id, 'Vandalismo', 3);
  END IF;

  -- Subitens para Infraestrutura
  IF infraestrutura_id IS NOT NULL THEN
    INSERT INTO kanban_subitems (column_id, title, order_index) VALUES
      (infraestrutura_id, 'Aguardando material', 1),
      (infraestrutura_id, 'Aguardando Adiantamento', 2);
  END IF;

  -- Subitens para Manutenção Veicular
  IF manutencao_veicular_id IS NOT NULL THEN
    INSERT INTO kanban_subitems (column_id, title, order_index) VALUES
      (manutencao_veicular_id, 'Aguardando setor de transporte', 1),
      (manutencao_veicular_id, 'Aguardando Locadora', 2),
      (manutencao_veicular_id, 'Aguardando Oficina', 3);
  END IF;
END $$;