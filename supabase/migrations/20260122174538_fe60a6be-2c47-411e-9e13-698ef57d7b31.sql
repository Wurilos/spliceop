-- Renomear coluna odometer para municipality na tabela fuel_records
ALTER TABLE public.fuel_records RENAME COLUMN odometer TO municipality;

-- Alterar o tipo da coluna de integer para text
ALTER TABLE public.fuel_records ALTER COLUMN municipality TYPE text USING municipality::text;