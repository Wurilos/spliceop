import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SlaMetric {
  id: string;
  contract_id: string;
  month: string;
  availability: number | null;
  response_time: number | null;
  resolution_time: number | null;
  target_met: boolean | null;
  created_at: string | null;
}

export function useSlaMetrics() {
  const queryClient = useQueryClient();

  const { data: slaMetrics = [], isLoading } = useQuery({
    queryKey: ['sla_metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_metrics')
        .select(`
          *,
          contracts:contracts!fk_sla_metrics_contract(number, client_name)
        `)
        .order('month', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (metric: Omit<SlaMetric, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('sla_metrics').insert(metric).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla_metrics'] });
      toast.success('Métrica SLA criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar métrica SLA'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...metric }: Partial<SlaMetric> & { id: string }) => {
      const { data, error } = await supabase.from('sla_metrics').update(metric).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla_metrics'] });
      toast.success('Métrica SLA atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar métrica SLA'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sla_metrics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla_metrics'] });
      toast.success('Métrica SLA excluída!');
    },
    onError: () => toast.error('Erro ao excluir métrica SLA'),
  });

  return {
    slaMetrics,
    isLoading,
    createSlaMetric: createMutation.mutate,
    updateSlaMetric: updateMutation.mutate,
    deleteSlaMetric: deleteMutation.mutate,
  };
}
