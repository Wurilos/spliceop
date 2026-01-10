-- Create table for tracking issue history/changes
CREATE TABLE public.pending_issues_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.pending_issues(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'moved', 'updated', 'status_changed'
  old_value TEXT,
  new_value TEXT,
  field_name TEXT, -- 'column_key', 'status', 'priority', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_issues_history ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view history
CREATE POLICY "Authenticated users can view issue history"
ON public.pending_issues_history
FOR SELECT
TO authenticated
USING (true);

-- Create policy for authenticated users to insert history
CREATE POLICY "Authenticated users can insert issue history"
ON public.pending_issues_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_pending_issues_history_issue_id ON public.pending_issues_history(issue_id);
CREATE INDEX idx_pending_issues_history_created_at ON public.pending_issues_history(created_at DESC);