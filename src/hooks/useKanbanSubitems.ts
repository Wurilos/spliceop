import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KanbanSubitem {
  id: string;
  column_id: string;
  title: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useKanbanSubitems(columnId?: string) {
  const queryClient = useQueryClient();

  const { data: subitems = [], isLoading } = useQuery({
    queryKey: ['kanban_subitems', columnId],
    queryFn: async () => {
      let query = supabase
        .from('kanban_subitems')
        .select('*')
        .order('order_index', { ascending: true });

      if (columnId) {
        query = query.eq('column_id', columnId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KanbanSubitem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (subitem: { column_id: string; title: string; order_index?: number }) => {
      const { data, error } = await supabase
        .from('kanban_subitems')
        .insert({
          column_id: subitem.column_id,
          title: subitem.title,
          order_index: subitem.order_index || 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_subitems'] });
      toast.success('Subitem criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar subitem'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...subitem }: Partial<KanbanSubitem> & { id: string }) => {
      const { data, error } = await supabase
        .from('kanban_subitems')
        .update(subitem)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_subitems'] });
      toast.success('Subitem atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar subitem'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kanban_subitems').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_subitems'] });
      toast.success('Subitem excluído!');
    },
    onError: () => toast.error('Erro ao excluir subitem'),
  });

  return {
    subitems,
    activeSubitems: subitems.filter((s) => s.is_active),
    isLoading,
    createSubitem: createMutation.mutate,
    updateSubitem: updateMutation.mutate,
    deleteSubitem: deleteMutation.mutate,
  };
}

// Hook para buscar todos os subitems agrupados por coluna
export function useAllKanbanSubitems() {
  const { data: subitems = [], isLoading } = useQuery({
    queryKey: ['kanban_subitems_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_subitems')
        .select('*, kanban_columns(title)')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as (KanbanSubitem & { kanban_columns: { title: string } | null })[];
    },
  });

  // Agrupar por column_id
  const subitemsByColumn = subitems.reduce((acc, item) => {
    if (!acc[item.column_id]) {
      acc[item.column_id] = [];
    }
    acc[item.column_id].push(item);
    return acc;
  }, {} as Record<string, typeof subitems>);

  // Agrupar por título da coluna (tipo de demanda)
  const subitemsByType = subitems.reduce((acc, item) => {
    const columnTitle = item.kanban_columns?.title || '';
    if (columnTitle && !acc[columnTitle]) {
      acc[columnTitle] = [];
    }
    if (columnTitle) {
      acc[columnTitle].push(item.title);
    }
    return acc;
  }, {} as Record<string, string[]>);

  return {
    subitems,
    subitemsByColumn,
    subitemsByType,
    isLoading,
  };
}
