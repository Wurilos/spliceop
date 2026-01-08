import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MaintenanceItem {
  component_id: string;
  quantity: number;
}

export interface StockMaintenance {
  id: string;
  contract_id: string | null;
  om_number: string;
  nf_number: string;
  send_date: string;
  return_date: string | null;
  return_nf: string | null;
  observations: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  contracts?: { client_name: string; number: string } | null;
  stock_maintenance_items?: Array<{
    id: string;
    component_id: string;
    quantity: number;
    components?: { name: string } | null;
  }>;
}

export function useStockMaintenance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['stock_maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_maintenance')
        .select('*, contracts(client_name, number), stock_maintenance_items(id, component_id, quantity, components(name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StockMaintenance[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (record: {
      contract_id: string | null;
      om_number: string;
      nf_number: string;
      send_date: string;
      return_date?: string | null;
      return_nf?: string | null;
      observations?: string | null;
      items: MaintenanceItem[];
    }) => {
      const { items, ...maintenanceData } = record;
      
      // Create maintenance record
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('stock_maintenance')
        .insert(maintenanceData)
        .select()
        .single();
      
      if (maintenanceError) throw maintenanceError;

      // Create maintenance items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          maintenance_id: maintenance.id,
          component_id: item.component_id,
          quantity: item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('stock_maintenance_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return maintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({ title: 'Manutenção registrada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao registrar', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, items, ...record }: {
      id: string;
      contract_id?: string | null;
      om_number?: string;
      nf_number?: string;
      send_date?: string;
      return_date?: string | null;
      return_nf?: string | null;
      observations?: string | null;
      status?: string;
      items?: MaintenanceItem[];
    }) => {
      const { data, error } = await supabase
        .from('stock_maintenance')
        .update(record)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // If items are provided, update them
      if (items) {
        // Delete existing items
        await supabase.from('stock_maintenance_items').delete().eq('maintenance_id', id);
        
        // Insert new items
        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            maintenance_id: id,
            component_id: item.component_id,
            quantity: item.quantity,
          }));

          const { error: itemsError } = await supabase
            .from('stock_maintenance_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({ title: 'Manutenção atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stock_maintenance').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({ title: 'Manutenção excluída!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('stock_maintenance').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast({ title: 'Manutenções excluídas!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  return {
    items: query.data || [],
    loading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
