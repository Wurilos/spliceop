import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EnergyBill {
  id: string;
  contract_id: string | null;
  consumer_unit: string;
  reference_month: string;
  value: number | null;
  due_date: string | null;
  status: string | null;
  supplier_id: string | null;
  equipment_id: string | null;
  created_at: string | null;
}

export function useEnergyBills() {
  const queryClient = useQueryClient();

  const { data: energyBills = [], isLoading } = useQuery({
    queryKey: ['energy_bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('energy_bills')
        .select(`
          *,
          contracts:contracts!fk_energy_bills_contract(number, client_name),
          suppliers:energy_suppliers(name)
        `)
        .order('reference_month', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (bill: Omit<EnergyBill, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('energy_bills').insert(bill).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_bills'] });
      toast.success('Conta de energia criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar conta de energia'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...bill }: Partial<EnergyBill> & { id: string }) => {
      const { data, error } = await supabase.from('energy_bills').update(bill).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_bills'] });
      toast.success('Conta de energia atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar conta de energia'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('energy_bills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_bills'] });
      toast.success('Conta de energia excluída!');
    },
    onError: () => toast.error('Erro ao excluir conta de energia'),
  });

  return {
    energyBills,
    isLoading,
    createEnergyBill: createMutation.mutate,
    updateEnergyBill: updateMutation.mutate,
    deleteEnergyBill: deleteMutation.mutate,
  };
}
