-- Criar tabela de equipes
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para equipes
CREATE POLICY "Equipes são visíveis para todos autenticados" 
ON public.teams FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar equipes" 
ON public.teams FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar equipes" 
ON public.teams FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar equipes" 
ON public.teams FOR DELETE 
TO authenticated
USING (true);

-- Adicionar coluna team_id em mileage_records
ALTER TABLE public.mileage_records 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Remover a constraint de employee_id se existir (tornar opcional)
ALTER TABLE public.mileage_records 
ALTER COLUMN employee_id DROP NOT NULL;

-- Criar função para atualizar o current_km do veículo
CREATE OR REPLACE FUNCTION public.update_vehicle_current_km()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o current_km do veículo com o final_km mais recente
  UPDATE public.vehicles
  SET current_km = NEW.final_km,
      updated_at = now()
  WHERE id = NEW.vehicle_id
    AND (current_km IS NULL OR current_km < NEW.final_km);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para atualizar automaticamente o current_km
CREATE TRIGGER update_vehicle_km_on_mileage
AFTER INSERT OR UPDATE ON public.mileage_records
FOR EACH ROW
EXECUTE FUNCTION public.update_vehicle_current_km();

-- Trigger para updated_at na tabela teams
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();