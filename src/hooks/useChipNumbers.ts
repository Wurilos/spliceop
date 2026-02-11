import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChipNumber {
  id: string;
  line_number: string;
  carrier: string;
  sub_carrier: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type ChipNumberInsert = Omit<ChipNumber, 'id' | 'created_at' | 'updated_at'>;

export function useChipNumbers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chipNumbers = [], isLoading: loading, error } = useQuery({
    queryKey: ['chip_numbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chip_numbers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as ChipNumber[]) ?? [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (chipNumber: ChipNumberInsert) => {
      const { data, error } = await supabase
        .from('chip_numbers')
        .insert(chipNumber)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chip_numbers'] });
      toast({ title: 'Chip cadastrado com sucesso!' });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({ title: 'Erro', description: 'Este número de linha já está cadastrado', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao cadastrar chip', description: error.message, variant: 'destructive' });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...chipNumber }: Partial<ChipNumber> & { id: string }) => {
      const { data, error } = await supabase
        .from('chip_numbers')
        .update(chipNumber)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chip_numbers'] });
      toast({ title: 'Chip atualizado com sucesso!' });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({ title: 'Erro', description: 'Este número de linha já está cadastrado', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao atualizar chip', description: error.message, variant: 'destructive' });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chip_numbers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chip_numbers'] });
      toast({ title: 'Chip excluído com sucesso!' });
    },
    onError: (error: any) => {
      if (error.code === '23503') {
        toast({ title: 'Erro', description: 'Este chip está vinculado a um equipamento e não pode ser excluído', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao excluir chip', description: error.message, variant: 'destructive' });
      }
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('chip_numbers')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chip_numbers'] });
      toast({ title: 'Chips excluídos com sucesso!' });
    },
    onError: (error: any) => {
      if (error.code === '23503') {
        toast({ title: 'Erro', description: 'Alguns chips estão vinculados a equipamentos e não podem ser excluídos', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao excluir chips', description: error.message, variant: 'destructive' });
      }
    },
  });

  return {
    chipNumbers,
    loading,
    error,
    createChipNumber: createMutation.mutate,
    updateChipNumber: updateMutation.mutate,
    deleteChipNumber: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
