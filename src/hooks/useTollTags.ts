import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TollTag {
  id: string;
  vehicle_id: string;
  tag_number: string;
  toll_plaza: string | null;
  passage_date: string;
  value: number;
  created_at: string | null;
}

export function useTollTags() {
  const queryClient = useQueryClient();

  const { data: tollTags = [], isLoading } = useQuery({
    queryKey: ['toll_tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('toll_tags')
        .select('*')
        .order('passage_date', { ascending: false });
      if (error) throw error;
      return data as TollTag[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tag: Omit<TollTag, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('toll_tags').insert(tag).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll_tags'] });
      toast.success('Tag de pedágio criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar tag de pedágio'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...tag }: Partial<TollTag> & { id: string }) => {
      const { data, error } = await supabase.from('toll_tags').update(tag).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll_tags'] });
      toast.success('Tag de pedágio atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar tag de pedágio'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('toll_tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll_tags'] });
      toast.success('Tag de pedágio excluída!');
    },
    onError: () => toast.error('Erro ao excluir tag de pedágio'),
  });

  return {
    tollTags,
    isLoading,
    createTollTag: createMutation.mutate,
    updateTollTag: updateMutation.mutate,
    deleteTollTag: deleteMutation.mutate,
  };
}
