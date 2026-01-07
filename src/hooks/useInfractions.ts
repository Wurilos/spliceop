import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Infraction {
  id: string;
  equipment_id: string;
  date: string;
  plate: string | null;
  speed: number | null;
  limit_speed: number | null;
  status: string | null;
  created_at: string | null;
}

export function useInfractions() {
  const queryClient = useQueryClient();

  const { data: infractions = [], isLoading } = useQuery({
    queryKey: ['infractions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('infractions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Infraction[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (infraction: Omit<Infraction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('infractions').insert(infraction).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infractions'] });
      toast.success('Infração criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar infração'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...infraction }: Partial<Infraction> & { id: string }) => {
      const { data, error } = await supabase.from('infractions').update(infraction).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infractions'] });
      toast.success('Infração atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar infração'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('infractions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infractions'] });
      toast.success('Infração excluída!');
    },
    onError: () => toast.error('Erro ao excluir infração'),
  });

  return {
    infractions,
    isLoading,
    createInfraction: createMutation.mutate,
    updateInfraction: updateMutation.mutate,
    deleteInfraction: deleteMutation.mutate,
  };
}
