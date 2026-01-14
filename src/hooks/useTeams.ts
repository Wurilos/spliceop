import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamInsert {
  name: string;
  description?: string | null;
}

interface TeamUpdate {
  id: string;
  name?: string;
  description?: string | null;
}

export function useTeams() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Team[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const createMutation = useMutation({
    mutationFn: async (team: TeamInsert) => {
      const { data, error } = await supabase.from('teams').insert(team).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Equipe criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar equipe', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...team }: TeamUpdate) => {
      const { data, error } = await supabase.from('teams').update(team).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Equipe atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar equipe', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Equipe excluída com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir equipe', description: error.message, variant: 'destructive' });
    },
  });

  return {
    teams: query.data || [],
    loading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
