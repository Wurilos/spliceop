import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EpiOutput {
  id: string;
  item_id: string;
  employee_id: string;
  output_date: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  epi_items?: {
    id: string;
    code: string;
    description: string;
  };
  employees?: {
    id: string;
    full_name: string;
  };
}

export interface EpiOutputInsert {
  item_id: string;
  employee_id: string;
  output_date: string;
  quantity: number;
  notes?: string | null;
}

export interface EpiOutputUpdate extends Partial<EpiOutputInsert> {
  id: string;
}

export function useEpiOutputs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['epi_outputs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epi_outputs')
        .select(`
          *,
          epi_items (
            id,
            code,
            description
          ),
          employees (
            id,
            full_name
          )
        `)
        .order('output_date', { ascending: false });
      if (error) throw error;
      return data as EpiOutput[];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (record: EpiOutputInsert) => {
      const { data, error } = await supabase
        .from('epi_outputs')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_outputs'] });
      queryClient.invalidateQueries({ queryKey: ['epi_stock'] });
      toast({ title: 'Saída de EPI registrada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao registrar saída', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...record }: EpiOutputUpdate) => {
      const { data, error } = await supabase
        .from('epi_outputs')
        .update(record)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_outputs'] });
      queryClient.invalidateQueries({ queryKey: ['epi_stock'] });
      toast({ title: 'Saída de EPI atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar saída', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('epi_outputs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_outputs'] });
      queryClient.invalidateQueries({ queryKey: ['epi_stock'] });
      toast({ title: 'Saída de EPI excluída!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir saída', description: error.message, variant: 'destructive' });
    },
  });

  return {
    outputs: query.data || [],
    loading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
