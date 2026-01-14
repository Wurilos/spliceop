import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type MileageRecord = Tables<'mileage_records'>;
type MileageRecordInsert = TablesInsert<'mileage_records'>;
type MileageRecordUpdate = TablesUpdate<'mileage_records'>;

export function useMileageRecords() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mileage_records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mileage_records')
        .select('*, vehicles!fk_mileage_records_vehicle(plate, brand, model), teams(id, name)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const createMutation = useMutation({
    mutationFn: async (record: MileageRecordInsert) => {
      const { data, error } = await supabase.from('mileage_records').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_records'] });
      toast({ title: 'Quilometragem registrada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao registrar', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...record }: MileageRecordUpdate & { id: string }) => {
      const { data, error } = await supabase.from('mileage_records').update(record).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_records'] });
      toast({ title: 'Quilometragem atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mileage_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_records'] });
      toast({ title: 'Quilometragem excluída!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('mileage_records').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileage_records'] });
      toast({ title: 'Quilometragens excluídas!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  return {
    records: query.data || [],
    loading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
