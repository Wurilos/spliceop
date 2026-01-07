import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceGoal {
  id: string;
  contract_id: string;
  month: string;
  target_calls: number | null;
  completed_calls: number | null;
  percentage: number | null;
  created_at: string | null;
}

export function useServiceGoals() {
  const queryClient = useQueryClient();

  const { data: serviceGoals = [], isLoading } = useQuery({
    queryKey: ['service_goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_goals')
        .select('*')
        .order('month', { ascending: false });
      if (error) throw error;
      return data as ServiceGoal[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (goal: Omit<ServiceGoal, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('service_goals').insert(goal).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_goals'] });
      toast.success('Meta criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar meta'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...goal }: Partial<ServiceGoal> & { id: string }) => {
      const { data, error } = await supabase.from('service_goals').update(goal).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_goals'] });
      toast.success('Meta atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar meta'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_goals'] });
      toast.success('Meta excluída!');
    },
    onError: () => toast.error('Erro ao excluir meta'),
  });

  return {
    serviceGoals,
    isLoading,
    createServiceGoal: createMutation.mutate,
    updateServiceGoal: updateMutation.mutate,
    deleteServiceGoal: deleteMutation.mutate,
  };
}
