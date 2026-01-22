import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Equipment = Tables<'equipment'>;
type EquipmentInsert = TablesInsert<'equipment'>;
type EquipmentUpdate = TablesUpdate<'equipment'>;

export function useEquipment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*, contracts!fk_equipment_contract(number, client_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (equipment: EquipmentInsert) => {
      const { data, error } = await supabase
        .from('equipment')
        .insert(equipment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({ title: 'Equipamento criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar equipamento', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...equipment }: EquipmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('equipment')
        .update(equipment)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({ title: 'Equipamento atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar equipamento', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({ title: 'Equipamento excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir equipamento', description: error.message, variant: 'destructive' });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('equipment').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({ title: 'Equipamentos excluídos com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir equipamentos', description: error.message, variant: 'destructive' });
    },
  });

  return {
    equipment: query.data || [],
    loading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending || deleteManyMutation.isPending,
  };
}
