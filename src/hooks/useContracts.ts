import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Contract = Tables<'contracts'>;
type ContractInsert = TablesInsert<'contracts'>;
type ContractUpdate = TablesUpdate<'contracts'>;

export function useContracts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (contract: ContractInsert) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contract)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Contrato criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar contrato', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...contract }: ContractUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(contract)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Contrato atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar contrato', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Contrato excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir contrato', description: error.message, variant: 'destructive' });
    },
  });

  return {
    contracts: query.data || [],
    loading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
