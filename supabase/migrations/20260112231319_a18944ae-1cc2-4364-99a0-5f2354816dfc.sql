-- Remove colunas resolution e status da tabela service_calls
ALTER TABLE public.service_calls DROP COLUMN IF EXISTS resolution;
ALTER TABLE public.service_calls DROP COLUMN IF EXISTS status;