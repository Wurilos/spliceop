import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KanbanIssue {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  contract_id: string | null;
  equipment_id: string | null;
  vehicle_id: string | null;
  assigned_to: string | null;
  column_key: string | null;
  type: string | null;
  address: string | null;
  team: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  contracts?: { number: string; client_name: string } | null;
  equipment?: { serial_number: string } | null;
  vehicles?: { plate: string; model: string | null } | null;
  employees?: { full_name: string } | null;
}

// Helper function to add history entry
async function addHistoryEntry(entry: {
  issue_id: string;
  action: string;
  old_value?: string | null;
  new_value?: string | null;
  field_name?: string | null;
}) {
  await supabase
    .from('pending_issues_history')
    .insert({
      issue_id: entry.issue_id,
      action: entry.action,
      old_value: entry.old_value || null,
      new_value: entry.new_value || null,
      field_name: entry.field_name || null,
    });
}

export function useKanbanIssues() {
  const queryClient = useQueryClient();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['kanban_issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_issues')
        .select(`
          *,
          contracts!fk_pending_issues_contract(number, client_name),
          equipment!fk_pending_issues_equipment(serial_number),
          vehicles(plate, model),
          employees!fk_pending_issues_employee(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KanbanIssue[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (issue: Partial<KanbanIssue>) => {
      const { contracts, equipment, vehicles, employees, ...cleanIssue } = issue as any;
      const { data, error } = await supabase.from('pending_issues').insert(cleanIssue).select().single();
      if (error) throw error;
      
      // Add creation history
      await addHistoryEntry({
        issue_id: data.id,
        action: 'created',
        new_value: issue.type || 'Demanda',
        field_name: 'type',
      });
      
      // Update equipment status to "maintenance" if equipment was selected
      if (cleanIssue.equipment_id) {
        await supabase
          .from('equipment')
          .update({ status: 'maintenance' })
          .eq('id', cleanIssue.equipment_id);
      }
      
      // Update vehicle status to "maintenance" if vehicle was selected
      if (cleanIssue.vehicle_id) {
        await supabase
          .from('vehicles')
          .update({ status: 'maintenance' })
          .eq('id', cleanIssue.vehicle_id);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_issues'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Demanda criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar demanda'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...issue }: Partial<KanbanIssue> & { id: string }) => {
      const { contracts, equipment, vehicles, employees, ...cleanIssue } = issue as any;
      
      // Get current issue to track changes
      const { data: currentIssue } = await supabase
        .from('pending_issues')
        .select('status, priority, team')
        .eq('id', id)
        .single();
      
      const { data, error } = await supabase.from('pending_issues').update(cleanIssue).eq('id', id).select().single();
      if (error) throw error;
      
      // Track status change
      if (cleanIssue.status !== undefined && currentIssue?.status !== cleanIssue.status) {
        await addHistoryEntry({
          issue_id: id,
          action: 'status_changed',
          old_value: currentIssue?.status || 'Sem status',
          new_value: cleanIssue.status,
          field_name: 'status',
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue_history'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: () => toast.error('Erro ao atualizar demanda'),
  });

  const moveIssue = useMutation({
    mutationFn: async ({ id, column_key, newType }: { id: string; column_key: string; newType?: string }) => {
      // Get current issue to track column change
      const { data: currentIssue } = await supabase
        .from('pending_issues')
        .select('column_key, type')
        .eq('id', id)
        .single();
      
      // When moving to a new column, update the type to match the column and reset substatus
      const updateData: Record<string, any> = { column_key };
      if (newType) {
        updateData.type = newType;
        updateData.status = null; // Reset substatus when changing column/type
      }
      const { error } = await supabase.from('pending_issues').update(updateData).eq('id', id);
      if (error) throw error;
      
      // Track movement
      if (currentIssue?.type !== newType) {
        await addHistoryEntry({
          issue_id: id,
          action: 'moved',
          old_value: currentIssue?.type || 'Coluna anterior',
          new_value: newType || column_key,
          field_name: 'column_key',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue_history'] });
    },
    onError: () => toast.error('Erro ao mover demanda'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pending_issues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban_issues'] });
      toast.success('Demanda excluída!');
    },
    onError: () => toast.error('Erro ao excluir demanda'),
  });

  return {
    issues,
    isLoading,
    createIssue: createMutation.mutate,
    updateIssue: updateMutation.mutate,
    moveIssue: moveIssue.mutate,
    deleteIssue: deleteMutation.mutate,
  };
}
