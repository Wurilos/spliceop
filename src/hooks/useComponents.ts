import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Component {
  id: string;
  code: string | null;
  name: string;
  type: string | null;
  description: string | null;
  value: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useComponents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data as Component[]) ?? [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (record: { code?: string; name: string; type?: string; description?: string; value?: number }) => {
      const { data, error } = await supabase.from('components').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      toast({ title: 'Componente cadastrado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...record }: Partial<Component> & { id: string }) => {
      const { data, error } = await supabase.from('components').update(record).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      toast({ title: 'Componente atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('components').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      toast({ title: 'Componente excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('components').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      toast({ title: 'Componentes excluídos!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  return {
    components: query.data || [],
    loading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
