import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InternetProvider {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useInternetProviders() {
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['internet_providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internet_providers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as InternetProvider[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (provider: Omit<InternetProvider, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('internet_providers').insert(provider).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_providers'] });
      toast.success('Provedor criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar provedor'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...provider }: Partial<InternetProvider> & { id: string }) => {
      const { data, error } = await supabase.from('internet_providers').update(provider).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_providers'] });
      toast.success('Provedor atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar provedor'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('internet_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_providers'] });
      toast.success('Provedor excluído!');
    },
    onError: () => toast.error('Erro ao excluir provedor'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('internet_providers').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_providers'] });
      toast.success('Provedores excluídos!');
    },
    onError: () => toast.error('Erro ao excluir provedores'),
  });

  return {
    providers,
    isLoading,
    createProvider: createMutation.mutate,
    updateProvider: updateMutation.mutate,
    deleteProvider: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
  };
}
