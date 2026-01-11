-- Adicionar coluna team_id na tabela employees
ALTER TABLE public.employees 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;