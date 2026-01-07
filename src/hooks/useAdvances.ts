import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Advance {
  id: string;
  employee_id: string;
  date: string;
  value: number;
  reason: string | null;
  status: string | null;
  created_at: string | null;
}

export function useAdvances() {
  const queryClient = useQueryClient();

  const { data: advances = [], isLoading } = useQuery({
    queryKey: ['advances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advances')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Advance[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (advance: Omit<Advance, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('advances').insert(advance).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      toast.success('Adiantamento criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar adiantamento'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...advance }: Partial<Advance> & { id: string }) => {
      const { data, error } = await supabase.from('advances').update(advance).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      toast.success('Adiantamento atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar adiantamento'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('advances').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      toast.success('Adiantamento excluído!');
    },
    onError: () => toast.error('Erro ao excluir adiantamento'),
  });

  return {
    advances,
    isLoading,
    createAdvance: createMutation.mutate,
    updateAdvance: updateMutation.mutate,
    deleteAdvance: deleteMutation.mutate,
  };
}
