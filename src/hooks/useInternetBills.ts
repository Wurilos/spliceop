import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InternetBill {
  id: string;
  contract_id: string | null;
  provider: string;
  reference_month: string;
  value: number | null;
  due_date: string | null;
  status: string | null;
  created_at: string | null;
}

export function useInternetBills() {
  const queryClient = useQueryClient();

  const { data: internetBills = [], isLoading } = useQuery({
    queryKey: ['internet_bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internet_bills')
        .select(`
          *,
          contracts:contracts!fk_internet_bills_contract(number, client_name),
          connections:internet_connections(serial_number)
        `)
        .order('reference_month', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (bill: Omit<InternetBill, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('internet_bills').insert(bill).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_bills'] });
      toast.success('Conta de internet criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar conta de internet'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...bill }: Partial<InternetBill> & { id: string }) => {
      const { data, error } = await supabase.from('internet_bills').update(bill).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_bills'] });
      toast.success('Conta de internet atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar conta de internet'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('internet_bills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_bills'] });
      toast.success('Conta de internet excluída!');
    },
    onError: () => toast.error('Erro ao excluir conta de internet'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('internet_bills').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_bills'] });
      toast.success('Contas excluídas!');
    },
    onError: () => toast.error('Erro ao excluir contas'),
  });

  return {
    internetBills,
    isLoading,
    createInternetBill: createMutation.mutate,
    updateInternetBill: updateMutation.mutate,
    deleteInternetBill: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
  };
}
