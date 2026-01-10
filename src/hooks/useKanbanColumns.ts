import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KanbanColumn {
  id: string;
  key: string;
  title: string;
  order_index: number;
  is_active: boolean;
  is_system: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export function useKanbanColumns() {
  const queryClient = useQueryClient();

  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['kanban_columns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as KanbanColumn[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (column: Omit<KanbanColumn, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('kanban_columns').insert(column).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_columns'] });
      toast.success('Coluna criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar coluna'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...column }: Partial<KanbanColumn> & { id: string }) => {
      const { data, error } = await supabase.from('kanban_columns').update(column).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_columns'] });
      toast.success('Coluna atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar coluna'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kanban_columns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_columns'] });
      toast.success('Coluna excluída!');
    },
    onError: () => toast.error('Erro ao excluir coluna'),
  });

  return {
    columns,
    activeColumns: columns.filter(c => c.is_active),
    isLoading,
    createColumn: createMutation.mutate,
    createColumnAsync: createMutation.mutateAsync,
    updateColumn: updateMutation.mutate,
    deleteColumn: deleteMutation.mutate,
  };
}
