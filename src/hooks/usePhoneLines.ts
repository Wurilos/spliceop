import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PhoneLine {
  id: string;
  contract_id: string | null;
  equipment_id: string | null;
  line_number: string;
  carrier: string;
  sub_carrier: string | null;
  created_at: string | null;
  updated_at: string | null;
  contracts?: { number: string; client_name: string } | null;
  equipment?: { serial_number: string } | null;
}

export type PhoneLineInsert = Omit<PhoneLine, 'id' | 'created_at' | 'updated_at' | 'contracts' | 'equipment'>;

export function usePhoneLines() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: phoneLines = [], isLoading: loading, error } = useQuery({
    queryKey: ['phone_lines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phone_lines')
        .select(`
          *,
          contracts(number, client_name),
          equipment(serial_number)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PhoneLine[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (phoneLine: PhoneLineInsert) => {
      const { data, error } = await supabase
        .from('phone_lines')
        .insert(phoneLine)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone_lines'] });
      toast({ title: 'Linha cadastrada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao cadastrar linha', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...phoneLine }: Partial<PhoneLine> & { id: string }) => {
      const { data, error } = await supabase
        .from('phone_lines')
        .update(phoneLine)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone_lines'] });
      toast({ title: 'Linha atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar linha', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('phone_lines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone_lines'] });
      toast({ title: 'Linha excluída com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir linha', description: error.message, variant: 'destructive' });
    },
  });

  return {
    phoneLines,
    loading,
    error,
    createPhoneLine: createMutation.mutate,
    updatePhoneLine: updateMutation.mutate,
    deletePhoneLine: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
