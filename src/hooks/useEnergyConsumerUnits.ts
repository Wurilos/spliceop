import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EnergyConsumerUnit {
  id: string;
  supplier_id: string | null;
  consumer_unit: string;
  contract_id: string | null;
  equipment_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useEnergyConsumerUnits() {
  const queryClient = useQueryClient();

  const { data: consumerUnits = [], isLoading } = useQuery({
    queryKey: ['energy_consumer_units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('energy_consumer_units')
        .select(`
          *,
          suppliers:energy_suppliers(name),
          contracts(number, client_name),
          equipment(serial_number)
        `)
        .order('consumer_unit', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (unit: Omit<EnergyConsumerUnit, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('energy_consumer_units').insert(unit).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_consumer_units'] });
      toast.success('Unidade consumidora criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar unidade consumidora'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...unit }: Partial<EnergyConsumerUnit> & { id: string }) => {
      const { data, error } = await supabase.from('energy_consumer_units').update(unit).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_consumer_units'] });
      toast.success('Unidade consumidora atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar unidade consumidora'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('energy_consumer_units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_consumer_units'] });
      toast.success('Unidade consumidora excluída!');
    },
    onError: () => toast.error('Erro ao excluir unidade consumidora'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('energy_consumer_units').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_consumer_units'] });
      toast.success('Unidades excluídas!');
    },
    onError: () => toast.error('Erro ao excluir unidades'),
  });

  return {
    consumerUnits,
    isLoading,
    createConsumerUnit: createMutation.mutate,
    updateConsumerUnit: updateMutation.mutate,
    deleteConsumerUnit: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
  };
}
