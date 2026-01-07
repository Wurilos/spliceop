import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface InfrastructureService {
  id: string;
  contract_id: string | null;
  serial_number: string;
  municipality: string;
  date: string;
  service_type: string;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  contracts?: { client_name: string; number: string } | null;
}

export function useInfrastructureServices() {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['infrastructure_services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('infrastructure_services')
        .select('*, contracts(client_name, number)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as InfrastructureService[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (service: Omit<InfrastructureService, 'id' | 'created_at' | 'updated_at' | 'contracts'>) => {
      const { error } = await supabase.from('infrastructure_services').insert(service);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure_services'] });
      toast({ title: 'Serviço criado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar serviço', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...service }: Partial<InfrastructureService> & { id: string }) => {
      const { error } = await supabase.from('infrastructure_services').update(service).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure_services'] });
      toast({ title: 'Serviço atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar serviço', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('infrastructure_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure_services'] });
      toast({ title: 'Serviço excluído com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir serviço', variant: 'destructive' });
    },
  });

  return {
    services,
    isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
