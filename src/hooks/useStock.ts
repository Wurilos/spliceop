import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Stock {
  id: string;
  contract_id: string | null;
  component_id: string;
  quantity: number;
  created_at: string | null;
  updated_at: string | null;
  contracts?: { client_name: string; number: string } | null;
  components?: { name: string; type: string | null } | null;
}

export function useStock() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock')
        .select('*, contracts(client_name, number), components(name, type)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Stock[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (record: { contract_id: string | null; component_id: string; quantity: number }) => {
      const { data, error } = await supabase.from('stock').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({ title: 'Item de estoque adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...record }: { id: string; contract_id?: string | null; component_id?: string; quantity?: number }) => {
      const { data, error } = await supabase.from('stock').update(record).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({ title: 'Estoque atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stock').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({ title: 'Item excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('stock').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({ title: 'Itens excluídos!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  return {
    items: query.data || [],
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
