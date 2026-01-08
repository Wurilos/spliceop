import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PendingIssue {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  contract_id: string | null;
  equipment_id: string | null;
  assigned_to: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function usePendingIssues() {
  const queryClient = useQueryClient();

  const { data: pendingIssues = [], isLoading } = useQuery({
    queryKey: ['pending_issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_issues')
        .select(`
          *,
          contracts:contracts!fk_pending_issues_contract(number, client_name),
          equipment:equipment!fk_pending_issues_equipment(serial_number),
          assigned:employees!fk_pending_issues_employee(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (issue: Omit<PendingIssue, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('pending_issues').insert(issue).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_issues'] });
      toast.success('Pendência criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar pendência'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...issue }: Partial<PendingIssue> & { id: string }) => {
      const { data, error } = await supabase.from('pending_issues').update(issue).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_issues'] });
      toast.success('Pendência atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar pendência'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pending_issues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_issues'] });
      toast.success('Pendência excluída!');
    },
    onError: () => toast.error('Erro ao excluir pendência'),
  });

  return {
    pendingIssues,
    isLoading,
    createPendingIssue: createMutation.mutate,
    updatePendingIssue: updateMutation.mutate,
    deletePendingIssue: deleteMutation.mutate,
  };
}
