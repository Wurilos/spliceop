import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContractAmendment {
  id: string;
  contract_id: string;
  amendment_number: number;
  start_date: string;
  end_date: string;
  value: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractAmendmentInsert {
  contract_id: string;
  amendment_number: number;
  start_date: string;
  end_date: string;
  value: number;
  description?: string | null;
}

export type ContractAmendmentUpdate = Partial<Omit<ContractAmendmentInsert, 'contract_id'>> & { id: string };

export function useContractAmendments(contractId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contract_amendments', contractId],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('contract_amendments')
        .select('*')
        .order('amendment_number', { ascending: true });
      
      if (contractId) {
        queryBuilder = queryBuilder.eq('contract_id', contractId);
      }
      
      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data as ContractAmendment[];
    },
    enabled: contractId !== undefined || contractId === undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Query para buscar todos os aditivos (para uso no dashboard)
  const allAmendmentsQuery = useQuery({
    queryKey: ['contract_amendments', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_amendments')
        .select('*')
        .order('amendment_number', { ascending: false });
      if (error) throw error;
      return data as ContractAmendment[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (amendment: ContractAmendmentInsert) => {
      const { data, error } = await supabase
        .from('contract_amendments')
        .insert(amendment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_amendments'] });
      toast({ title: 'Aditivo criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar aditivo', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...amendment }: ContractAmendmentUpdate) => {
      const { data, error } = await supabase
        .from('contract_amendments')
        .update(amendment)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_amendments'] });
      toast({ title: 'Aditivo atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar aditivo', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contract_amendments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_amendments'] });
      toast({ title: 'Aditivo excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir aditivo', description: error.message, variant: 'destructive' });
    },
  });

  // Função auxiliar para obter o valor efetivo do contrato (último aditivo ou valor original)
  const getEffectiveValue = (contractId: string, originalValue: number): number => {
    const amendments = allAmendmentsQuery.data?.filter(a => a.contract_id === contractId) || [];
    if (amendments.length === 0) return originalValue;
    // Pega o aditivo com maior número (mais recente)
    const latestAmendment = amendments.reduce((prev, curr) => 
      curr.amendment_number > prev.amendment_number ? curr : prev
    );
    return Number(latestAmendment.value) || originalValue;
  };

  return {
    amendments: query.data || [],
    allAmendments: allAmendmentsQuery.data || [],
    loading: query.isLoading,
    allLoading: allAmendmentsQuery.isLoading,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getEffectiveValue,
  };
}
