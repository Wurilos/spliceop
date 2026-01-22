import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SealServiceOrder {
  id: string;
  order_number: string;
  contract_id: string | null;
  equipment_id: string | null;
  maintenance_description: string | null;
  category: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  contracts?: {
    number: string;
    client_name: string;
  } | null;
  equipment?: {
    serial_number: string;
  } | null;
  items?: SealServiceOrderItem[];
}

export interface SealServiceOrderItem {
  id: string;
  service_order_id: string;
  seal_id: string;
  installation_item: string;
  created_at: string | null;
  seals?: {
    seal_number: string;
  } | null;
}

export interface CreateServiceOrderInput {
  order_number: string;
  contract_id: string | null;
  equipment_id: string | null;
  maintenance_description: string | null;
  category: string | null;
  items: { seal_id: string; installation_item: string }[];
}

export function useSealServiceOrders() {
  const queryClient = useQueryClient();

  const { data: serviceOrders = [], isLoading } = useQuery({
    queryKey: ['seal_service_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seal_service_orders')
        .select(`
          *,
          contracts(number, client_name),
          equipment(serial_number)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch items for each service order
      const ordersWithItems = await Promise.all(
        (data || []).map(async (order) => {
          const { data: items } = await supabase
            .from('seal_service_order_items')
            .select(`
              *,
              seals(seal_number)
            `)
            .eq('service_order_id', order.id);
          return { ...order, items: items || [] };
        })
      );

      return (ordersWithItems as SealServiceOrder[]) ?? [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateServiceOrderInput) => {
      const { items, ...orderData } = input;
      
      // Create the service order
      const { data: order, error: orderError } = await supabase
        .from('seal_service_orders')
        .insert({
          ...orderData,
          status: 'closed',
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Create the items and update seals status
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          service_order_id: order.id,
          seal_id: item.seal_id,
          installation_item: item.installation_item,
        }));

        const { error: itemsError } = await supabase
          .from('seal_service_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        // Update seals status to 'installed' and link to equipment
        for (const item of items) {
          await supabase
            .from('seals')
            .update({ 
              status: 'installed',
              equipment_id: orderData.equipment_id,
              installation_date: new Date().toISOString().split('T')[0],
              service_order: orderData.order_number,
            })
            .eq('id', item.seal_id);
        }
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seal_service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['seals'] });
      toast.success('Ordem de serviço criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar ordem de serviço'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get the items to revert seal status
      const { data: items } = await supabase
        .from('seal_service_order_items')
        .select('seal_id')
        .eq('service_order_id', id);

      // Revert seals status
      if (items && items.length > 0) {
        for (const item of items) {
          await supabase
            .from('seals')
            .update({ 
              status: 'available',
              equipment_id: null,
              installation_date: null,
              service_order: null,
            })
            .eq('id', item.seal_id);
        }
      }

      // Delete the service order (items will be cascade deleted)
      const { error } = await supabase
        .from('seal_service_orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seal_service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['seals'] });
      toast.success('Ordem de serviço excluída!');
    },
    onError: () => toast.error('Erro ao excluir ordem de serviço'),
  });

  return {
    serviceOrders,
    isLoading,
    createServiceOrder: createMutation.mutate,
    deleteServiceOrder: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
