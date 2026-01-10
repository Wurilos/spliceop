import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ArchivedIssue {
  id: string;
  original_issue_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  type: string | null;
  status: string | null;
  address: string | null;
  team: string | null;
  due_date: string | null;
  contract_id: string | null;
  equipment_id: string | null;
  vehicle_id: string | null;
  contract_name: string | null;
  equipment_serial: string | null;
  vehicle_plate: string | null;
  created_at: string | null;
  completed_at: string;
  archived_at: string;
}

export function useArchivedIssues() {
  const { data: archivedIssues = [], isLoading } = useQuery({
    queryKey: ['archived-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('archived_issues')
        .select('*')
        .order('archived_at', { ascending: false });

      if (error) throw error;
      return data as ArchivedIssue[];
    },
  });

  // Stats for charts
  const contractStats = archivedIssues.reduce((acc, issue) => {
    const key = issue.contract_name || 'Sem Contrato';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const equipmentStats = archivedIssues.reduce((acc, issue) => {
    const key = issue.equipment_serial || issue.vehicle_plate || 'Sem Ativo';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeStats = archivedIssues.reduce((acc, issue) => {
    const key = issue.type || 'Sem Tipo';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to chart-friendly format and sort by count
  const contractChartData = Object.entries(contractStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const equipmentChartData = Object.entries(equipmentStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const typeChartData = Object.entries(typeStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    archivedIssues,
    isLoading,
    contractChartData,
    equipmentChartData,
    typeChartData,
  };
}
