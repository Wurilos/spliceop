import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImageMetric {
  id: string;
  equipment_id: string;
  date: string;
  total_captures: number | null;
  valid_captures: number | null;
  utilization_rate: number | null;
  created_at: string | null;
}

export function useImageMetrics() {
  const queryClient = useQueryClient();

  const { data: imageMetrics = [], isLoading } = useQuery({
    queryKey: ['image_metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('image_metrics')
        .select(`
          *,
          equipment:equipment!fk_image_metrics_equipment(serial_number, type, address)
        `)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (metric: Omit<ImageMetric, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('image_metrics').insert(metric).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image_metrics'] });
      toast.success('Métrica criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar métrica'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...metric }: Partial<ImageMetric> & { id: string }) => {
      const { data, error } = await supabase.from('image_metrics').update(metric).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image_metrics'] });
      toast.success('Métrica atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar métrica'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('image_metrics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image_metrics'] });
      toast.success('Métrica excluída!');
    },
    onError: () => toast.error('Erro ao excluir métrica'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('image_metrics').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image_metrics'] });
      toast.success('Métricas excluídas!');
    },
    onError: () => toast.error('Erro ao excluir métricas'),
  });

  return {
    imageMetrics,
    isLoading,
    createImageMetric: createMutation.mutate,
    updateImageMetric: updateMutation.mutate,
    deleteImageMetric: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
  };
}
