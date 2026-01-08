import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EnergySupplier {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  contact: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useEnergySuppliers() {
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['energy_suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('energy_suppliers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as EnergySupplier[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (supplier: Omit<EnergySupplier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('energy_suppliers').insert(supplier).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_suppliers'] });
      toast.success('Fornecedor criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar fornecedor'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<EnergySupplier> & { id: string }) => {
      const { data, error } = await supabase.from('energy_suppliers').update(supplier).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_suppliers'] });
      toast.success('Fornecedor atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar fornecedor'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('energy_suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy_suppliers'] });
      toast.success('Fornecedor excluído!');
    },
    onError: () => toast.error('Erro ao excluir fornecedor'),
  });

  return {
    suppliers,
    isLoading,
    createSupplier: createMutation.mutate,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutate,
  };
}
