import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IssueHistory {
  id: string;
  issue_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  field_name: string | null;
  created_at: string;
}

export function useIssueHistory(issueId?: string) {
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['issue_history', issueId],
    queryFn: async () => {
      if (!issueId) return [];
      const { data, error } = await supabase
        .from('pending_issues_history')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IssueHistory[];
    },
    enabled: !!issueId,
  });

  const addHistoryMutation = useMutation({
    mutationFn: async (entry: {
      issue_id: string;
      action: string;
      old_value?: string | null;
      new_value?: string | null;
      field_name?: string | null;
    }) => {
      const { error } = await supabase
        .from('pending_issues_history')
        .insert({
          issue_id: entry.issue_id,
          action: entry.action,
          old_value: entry.old_value || null,
          new_value: entry.new_value || null,
          field_name: entry.field_name || null,
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue_history', variables.issue_id] });
    },
  });

  return {
    history,
    isLoading,
    addHistory: addHistoryMutation.mutateAsync,
  };
}
