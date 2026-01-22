import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerSatisfaction {
  id: string;
  contract_id: string;
  quarter: string;
  year: number;
  score: number | null;
  feedback: string | null;
  created_at: string | null;
}

export function useCustomerSatisfaction() {
  const queryClient = useQueryClient();

  const { data: satisfactionRecords = [], isLoading } = useQuery({
    queryKey: ['customer_satisfaction'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_satisfaction')
        .select(`
          *,
          contracts:contracts!fk_customer_satisfaction_contract(number, client_name)
        `)
        .order('year', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (record: Omit<CustomerSatisfaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('customer_satisfaction').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_satisfaction'] });
      toast.success('Pesquisa de satisfação criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar pesquisa de satisfação'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...record }: Partial<CustomerSatisfaction> & { id: string }) => {
      const { data, error } = await supabase.from('customer_satisfaction').update(record).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_satisfaction'] });
      toast.success('Pesquisa de satisfação atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar pesquisa de satisfação'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_satisfaction').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_satisfaction'] });
      toast.success('Pesquisa de satisfação excluída!');
    },
    onError: () => toast.error('Erro ao excluir pesquisa de satisfação'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('customer_satisfaction').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_satisfaction'] });
      toast.success('Pesquisas excluídas!');
    },
    onError: () => toast.error('Erro ao excluir pesquisas'),
  });

  return {
    satisfactionRecords,
    isLoading,
    createSatisfaction: createMutation.mutate,
    updateSatisfaction: updateMutation.mutate,
    deleteSatisfaction: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
  };
}
