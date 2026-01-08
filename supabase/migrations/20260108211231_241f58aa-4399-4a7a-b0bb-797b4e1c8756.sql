
-- Add contract_id to toll_tags table
ALTER TABLE public.toll_tags 
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_toll_tags_contract_id ON public.toll_tags(contract_id);
