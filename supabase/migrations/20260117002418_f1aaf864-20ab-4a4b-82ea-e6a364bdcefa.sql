-- Add new columns to advances table
ALTER TABLE public.advances
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id),
ADD COLUMN IF NOT EXISTS intranet TEXT,
ADD COLUMN IF NOT EXISTS closing_date DATE,
ADD COLUMN IF NOT EXISTS proven_value NUMERIC DEFAULT 0;

-- Rename 'date' to 'request_date' for clarity
ALTER TABLE public.advances RENAME COLUMN date TO request_date;

-- Rename 'value' to 'requested_value' for clarity  
ALTER TABLE public.advances RENAME COLUMN value TO requested_value;

-- Add foreign key constraint for contract
ALTER TABLE public.advances
ADD CONSTRAINT fk_advances_contract FOREIGN KEY (contract_id) REFERENCES public.contracts(id);