-- Adicionar campo vehicle_id na tabela pending_issues para vincular demandas a veículos
ALTER TABLE public.pending_issues ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- Adicionar campo team na tabela vehicles para associar veículos a equipes
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS team TEXT;

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_pending_issues_vehicle_id ON public.pending_issues(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_team ON public.vehicles(team);