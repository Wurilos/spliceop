import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EpiItem {
  id: string;
  code: string;
  description: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EpiItemInsert {
  code: string;
  description: string;
  photo_url?: string | null;
}

export interface EpiItemUpdate extends Partial<EpiItemInsert> {
  id: string;
}

export function useEpiItems() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['epi_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epi_items')
        .select('*')
        .order('description', { ascending: true });
      if (error) throw error;
      return data as EpiItem[];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (record: EpiItemInsert) => {
      const { data, error } = await supabase
        .from('epi_items')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_items'] });
      toast({ title: 'Item de EPI cadastrado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao cadastrar item', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...record }: EpiItemUpdate) => {
      const { data, error } = await supabase
        .from('epi_items')
        .update(record)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_items'] });
      toast({ title: 'Item de EPI atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('epi_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_items'] });
      toast({ title: 'Item de EPI excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    },
  });

  return {
    items: query.data || [],
    loading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
