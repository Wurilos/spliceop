-- Adicionar campos para solicitação de NF na tabela stock_maintenance
ALTER TABLE public.stock_maintenance
ADD COLUMN IF NOT EXISTS solicitante text,
ADD COLUMN IF NOT EXISTS centro_custo text,
ADD COLUMN IF NOT EXISTS destinatario text DEFAULT 'Matriz - Manutenção',
ADD COLUMN IF NOT EXISTS remetente text,
ADD COLUMN IF NOT EXISTS status_nf text DEFAULT 'pendente_nf';

-- Tornar om_number e nf_number opcionais (removendo constraint NOT NULL se existir)
ALTER TABLE public.stock_maintenance
ALTER COLUMN om_number DROP NOT NULL,
ALTER COLUMN nf_number DROP NOT NULL;

-- Adicionar campos detalhados aos itens de manutenção
ALTER TABLE public.stock_maintenance_items
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS defect_description text,
ADD COLUMN IF NOT EXISTS field_service_code text,
ADD COLUMN IF NOT EXISTS equipment_serial text;