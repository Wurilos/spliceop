-- Add completed_at column to track when issue was moved to "Concluído"
ALTER TABLE public.pending_issues 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create archived_issues table to store completed issues permanently
CREATE TABLE public.archived_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_issue_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  type TEXT,
  status TEXT,
  address TEXT,
  team TEXT,
  due_date DATE,
  contract_id UUID,
  equipment_id UUID,
  vehicle_id UUID,
  contract_name TEXT,
  equipment_serial TEXT,
  vehicle_plate TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.archived_issues ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view archived issues"
ON public.archived_issues
FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert archived issues"
ON public.archived_issues
FOR INSERT
WITH CHECK (public.is_authenticated());

-- Create index for faster queries
CREATE INDEX idx_archived_issues_contract_id ON public.archived_issues(contract_id);
CREATE INDEX idx_archived_issues_equipment_id ON public.archived_issues(equipment_id);
CREATE INDEX idx_archived_issues_type ON public.archived_issues(type);
CREATE INDEX idx_archived_issues_completed_at ON public.archived_issues(completed_at);