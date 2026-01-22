import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Employee = Tables<'employees'>;
type EmployeeInsert = TablesInsert<'employees'>;
type EmployeeUpdate = TablesUpdate<'employees'>;

export function useEmployees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, contracts!fk_employees_contract(number, client_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: async (employee: EmployeeInsert) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Colaborador criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar colaborador', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...employee }: EmployeeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Colaborador atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar colaborador', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Colaborador excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir colaborador', description: error.message, variant: 'destructive' });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('employees').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Colaboradores excluídos com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir colaboradores', description: error.message, variant: 'destructive' });
    },
  });

  return {
    employees: query.data || [],
    loading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    deleteMany: deleteManyMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending || deleteManyMutation.isPending,
  };
}
