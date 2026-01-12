-- Adicionar coluna third_party_contract à tabela service_calls
ALTER TABLE public.service_calls
ADD COLUMN third_party_contract TEXT;

COMMENT ON COLUMN public.service_calls.third_party_contract 
IS 'Nome do contrato terceiro quando não cadastrado no sistema';