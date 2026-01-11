-- Tabela para armazenar aditivos de contratos
CREATE TABLE public.contract_amendments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  amendment_number INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  value NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por contrato
CREATE INDEX idx_contract_amendments_contract_id ON public.contract_amendments(contract_id);

-- Habilitar RLS
ALTER TABLE public.contract_amendments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Aditivos são visíveis por todos autenticados" 
ON public.contract_amendments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar aditivos" 
ON public.contract_amendments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar aditivos" 
ON public.contract_amendments 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar aditivos" 
ON public.contract_amendments 
FOR DELETE 
TO authenticated
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contract_amendments_updated_at
BEFORE UPDATE ON public.contract_amendments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();