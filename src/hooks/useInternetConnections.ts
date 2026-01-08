import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InternetConnection {
  id: string;
  contract_id: string | null;
  serial_number: string;
  provider_id: string | null;
  client_code: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useInternetConnections() {
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['internet_connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internet_connections')
        .select(`
          *,
          contracts(number, client_name),
          providers:internet_providers(name)
        `)
        .order('serial_number', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (connection: Omit<InternetConnection, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('internet_connections').insert(connection).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_connections'] });
      toast.success('Cadastro criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar cadastro'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...connection }: Partial<InternetConnection> & { id: string }) => {
      const { data, error } = await supabase.from('internet_connections').update(connection).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_connections'] });
      toast.success('Cadastro atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar cadastro'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('internet_connections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_connections'] });
      toast.success('Cadastro excluído!');
    },
    onError: () => toast.error('Erro ao excluir cadastro'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('internet_connections').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet_connections'] });
      toast.success('Cadastros excluídos!');
    },
    onError: () => toast.error('Erro ao excluir cadastros'),
  });

  return {
    connections,
    isLoading,
    createConnection: createMutation.mutate,
    updateConnection: updateMutation.mutate,
    deleteConnection: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
  };
}
