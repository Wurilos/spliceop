-- Adicionar campo Cód. Mob na tabela service_calls
ALTER TABLE public.service_calls 
ADD COLUMN mob_code text;