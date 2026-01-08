-- Add new columns for equipment module based on the form
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS direction text, -- Sentido
  ADD COLUMN IF NOT EXISTS lanes_qty integer, -- Qtd Faixas
  ADD COLUMN IF NOT EXISTS speed_limit integer, -- Velocidade
  ADD COLUMN IF NOT EXISTS communication_type text, -- Meio de Comunicação
  ADD COLUMN IF NOT EXISTS modem_number text, -- Nº Modem
  ADD COLUMN IF NOT EXISTS energy_type text; -- Tipo de Energia