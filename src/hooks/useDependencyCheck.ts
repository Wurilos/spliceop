import { supabase } from '@/integrations/supabase/client';

interface DependencyResult {
  hasDependencies: boolean;
  dependencies: {
    table: string;
    count: number;
    label: string;
  }[];
}

const dependencyMap: Record<string, { table: string; column: string; label: string }[]> = {
  contracts: [
    { table: 'employees', column: 'contract_id', label: 'Colaboradores' },
    { table: 'equipment', column: 'contract_id', label: 'Equipamentos' },
    { table: 'vehicles', column: 'contract_id', label: 'Veículos' },
    { table: 'service_calls', column: 'contract_id', label: 'Atendimentos' },
    { table: 'invoices', column: 'contract_id', label: 'Faturas' },
    { table: 'energy_bills', column: 'contract_id', label: 'Contas de Energia' },
    { table: 'internet_bills', column: 'contract_id', label: 'Contas de Internet' },
    { table: 'customer_satisfaction', column: 'contract_id', label: 'Avaliações' },
    { table: 'sla_metrics', column: 'contract_id', label: 'Métricas SLA' },
    { table: 'service_goals', column: 'contract_id', label: 'Metas' },
    { table: 'pending_issues', column: 'contract_id', label: 'Pendências' },
    { table: 'infrastructure_services', column: 'contract_id', label: 'Serviços de Infraestrutura' },
  ],
  employees: [
    { table: 'mileage_records', column: 'employee_id', label: 'Registros de Quilometragem' },
    { table: 'service_calls', column: 'employee_id', label: 'Atendimentos' },
    { table: 'advances', column: 'employee_id', label: 'Adiantamentos' },
    { table: 'pending_issues', column: 'assigned_to', label: 'Pendências Atribuídas' },
    { table: 'seals', column: 'technician_id', label: 'Lacres' },
  ],
  equipment: [
    { table: 'calibrations', column: 'equipment_id', label: 'Aferições' },
    { table: 'service_calls', column: 'equipment_id', label: 'Atendimentos' },
    { table: 'image_metrics', column: 'equipment_id', label: 'Métricas de Imagem' },
    { table: 'infractions', column: 'equipment_id', label: 'Infrações' },
    { table: 'pending_issues', column: 'equipment_id', label: 'Pendências' },
    { table: 'seals', column: 'equipment_id', label: 'Lacres' },
  ],
  vehicles: [
    { table: 'fuel_records', column: 'vehicle_id', label: 'Abastecimentos' },
    { table: 'mileage_records', column: 'vehicle_id', label: 'Registros de Quilometragem' },
    { table: 'maintenance_records', column: 'vehicle_id', label: 'Manutenções' },
    { table: 'toll_tags', column: 'vehicle_id', label: 'Tags de Pedágio' },
  ],
};

type TableName = 'contracts' | 'employees' | 'equipment' | 'vehicles' | 'fuel_records' | 
  'mileage_records' | 'maintenance_records' | 'calibrations' | 'service_calls' | 
  'invoices' | 'energy_bills' | 'internet_bills' | 'advances' | 'toll_tags' | 
  'image_metrics' | 'infractions' | 'customer_satisfaction' | 'sla_metrics' | 
  'service_goals' | 'pending_issues' | 'seals' | 'infrastructure_services' | 'inventory';

export async function checkDependencies(
  tableName: TableName,
  recordId: string
): Promise<DependencyResult> {
  const deps = dependencyMap[tableName];
  
  if (!deps || deps.length === 0) {
    return { hasDependencies: false, dependencies: [] };
  }

  const dependencies: DependencyResult['dependencies'] = [];

  await Promise.all(
    deps.map(async (dep) => {
      const { count, error } = await supabase
        .from(dep.table as TableName)
        .select('*', { count: 'exact', head: true })
        .eq(dep.column, recordId);

      if (!error && count && count > 0) {
        dependencies.push({
          table: dep.table,
          count,
          label: dep.label,
        });
      }
    })
  );

  return {
    hasDependencies: dependencies.length > 0,
    dependencies,
  };
}
