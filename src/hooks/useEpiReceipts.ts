import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EpiReceipt {
  id: string;
  item_id: string;
  receipt_date: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  epi_items?: {
    id: string;
    code: string;
    description: string;
  };
}

export interface EpiReceiptInsert {
  item_id: string;
  receipt_date: string;
  quantity: number;
  notes?: string | null;
}

export interface EpiReceiptUpdate extends Partial<EpiReceiptInsert> {
  id: string;
}

export function useEpiReceipts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['epi_receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epi_receipts')
        .select(`
          *,
          epi_items (
            id,
            code,
            description
          )
        `)
        .order('receipt_date', { ascending: false });
      if (error) throw error;
      return data as EpiReceipt[];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (record: EpiReceiptInsert) => {
      const { data, error } = await supabase
        .from('epi_receipts')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_receipts'] });
      queryClient.invalidateQueries({ queryKey: ['epi_stock'] });
      toast({ title: 'Recebimento de EPI registrado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao registrar recebimento', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...record }: EpiReceiptUpdate) => {
      const { data, error } = await supabase
        .from('epi_receipts')
        .update(record)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_receipts'] });
      queryClient.invalidateQueries({ queryKey: ['epi_stock'] });
      toast({ title: 'Recebimento de EPI atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar recebimento', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('epi_receipts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epi_receipts'] });
      queryClient.invalidateQueries({ queryKey: ['epi_stock'] });
      toast({ title: 'Recebimento de EPI excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir recebimento', description: error.message, variant: 'destructive' });
    },
  });

  return {
    receipts: query.data || [],
    loading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
