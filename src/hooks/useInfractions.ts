import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Infraction = Tables<'infractions'>;
type InfractionInsert = TablesInsert<'infractions'>;
type InfractionUpdate = TablesUpdate<'infractions'>;

export function useInfractions() {
  const queryClient = useQueryClient();

  const { data: infractions = [], isLoading } = useQuery({
    queryKey: ['infractions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('infractions')
        .select(`
          *,
          equipment:equipment!fk_infractions_equipment(serial_number, type),
          contracts(number, client_name)
        `)
        .order('year', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (infraction: InfractionInsert) => {
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
    mutationFn: async ({ id, ...infraction }: InfractionUpdate & { id: string }) => {
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

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('infractions').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infractions'] });
      toast.success('Infrações excluídas!');
    },
    onError: () => toast.error('Erro ao excluir infrações'),
  });

  return {
    infractions,
    isLoading,
    createInfraction: createMutation.mutate,
    updateInfraction: updateMutation.mutate,
    deleteInfraction: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
  };
}
