import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KanbanIssue {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  contract_id: string | null;
  equipment_id: string | null;
  assigned_to: string | null;
  column_key: string | null;
  type: string | null;
  address: string | null;
  team: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  contracts?: { number: string; client_name: string } | null;
  equipment?: { serial_number: string } | null;
  employees?: { full_name: string } | null;
}

export function useKanbanIssues() {
  const queryClient = useQueryClient();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['kanban_issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_issues')
        .select(`
          *,
          contracts!fk_pending_issues_contract(number, client_name),
          equipment!fk_pending_issues_equipment(serial_number),
          employees!fk_pending_issues_employee(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KanbanIssue[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (issue: Partial<KanbanIssue>) => {
      const { contracts, equipment, employees, ...cleanIssue } = issue as any;
      const { data, error } = await supabase.from('pending_issues').insert(cleanIssue).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_issues'] });
      toast.success('Demanda criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar demanda'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...issue }: Partial<KanbanIssue> & { id: string }) => {
      const { contracts, equipment, employees, ...cleanIssue } = issue as any;
      const { data, error } = await supabase.from('pending_issues').update(cleanIssue).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_issues'] });
    },
    onError: () => toast.error('Erro ao atualizar demanda'),
  });

  const moveIssue = useMutation({
    mutationFn: async ({ id, column_key }: { id: string; column_key: string }) => {
      const { error } = await supabase.from('pending_issues').update({ column_key }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_issues'] });
    },
    onError: () => toast.error('Erro ao mover demanda'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pending_issues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_issues'] });
      toast.success('Demanda excluída!');
    },
    onError: () => toast.error('Erro ao excluir demanda'),
  });

  return {
    issues,
    isLoading,
    createIssue: createMutation.mutate,
    updateIssue: updateMutation.mutate,
    moveIssue: moveIssue.mutate,
    deleteIssue: deleteMutation.mutate,
  };
}
