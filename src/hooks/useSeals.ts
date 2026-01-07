import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Seal {
  id: string;
  equipment_id: string;
  seal_number: string;
  installation_date: string;
  service_order: string | null;
  technician_id: string | null;
  notes: string | null;
  created_at: string | null;
}

export function useSeals() {
  const queryClient = useQueryClient();

  const { data: seals = [], isLoading } = useQuery({
    queryKey: ['seals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seals')
        .select('*')
        .order('installation_date', { ascending: false });
      if (error) throw error;
      return data as Seal[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (seal: Omit<Seal, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('seals').insert(seal).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seals'] });
      toast.success('Lacre criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar lacre'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...seal }: Partial<Seal> & { id: string }) => {
      const { data, error } = await supabase.from('seals').update(seal).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seals'] });
      toast.success('Lacre atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar lacre'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seals'] });
      toast.success('Lacre excluído!');
    },
    onError: () => toast.error('Erro ao excluir lacre'),
  });

  return {
    seals,
    isLoading,
    createSeal: createMutation.mutate,
    updateSeal: updateMutation.mutate,
    deleteSeal: deleteMutation.mutate,
  };
}
