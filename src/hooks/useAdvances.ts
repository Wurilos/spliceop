import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Advance {
  id: string;
  contract_id: string | null;
  employee_id: string;
  intranet: string | null;
  request_date: string;
  requested_value: number;
  reason: string | null;
  closing_date: string | null;
  proven_value: number | null;
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
        .select(`
          *,
          employees:employees!fk_advances_employee(full_name, role),
          contracts:contracts!fk_advances_contract(number, client_name)
        `)
        .order('request_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
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

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('advances').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advances'] });
      toast.success('Adiantamentos excluídos!');
    },
    onError: () => toast.error('Erro ao excluir adiantamentos'),
  });

  return {
    advances,
    isLoading,
    createAdvance: createMutation.mutate,
    updateAdvance: updateMutation.mutate,
    deleteAdvance: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
  };
}
