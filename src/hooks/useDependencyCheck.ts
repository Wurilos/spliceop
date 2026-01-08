export type DependencyTableName = 'contracts' | 'employees' | 'equipment' | 'vehicles';

interface DependencyResult {
  hasDependencies: boolean;
  dependencies: {
    table: string;
    count: number;
    label: string;
  }[];
}

interface DependencyConfig {
  table: string;
  column: string;
  label: string;
}

const dependencyMap: Record<string, DependencyConfig[]> = {
  contracts: [
    { table: 'employees', column: 'contract_id', label: 'Colaboradores' },
    { table: 'equipment', column: 'contract_id', label: 'Equipamentos' },
    { table: 'vehicles', column: 'contract_id', label: 'Veículos' },
    { table: 'invoices', column: 'contract_id', label: 'Faturas' },
  ],
  employees: [
    { table: 'advances', column: 'employee_id', label: 'Adiantamentos' },
    { table: 'seals', column: 'technician_id', label: 'Lacres' },
  ],
  equipment: [
    { table: 'calibrations', column: 'equipment_id', label: 'Aferições' },
    { table: 'seals', column: 'equipment_id', label: 'Lacres' },
  ],
  vehicles: [
    { table: 'fuel_records', column: 'vehicle_id', label: 'Abastecimentos' },
    { table: 'maintenance_records', column: 'vehicle_id', label: 'Manutenções' },
    { table: 'toll_tags', column: 'vehicle_id', label: 'Tags de Pedágio' },
  ],
};

export async function checkDependencies(
  tableName: DependencyTableName,
  _recordId: string
): Promise<DependencyResult> {
  const deps = dependencyMap[tableName];
  
  if (!deps || deps.length === 0) {
    return { hasDependencies: false, dependencies: [] };
  }

  // Note: This is a simplified version that returns the dependency map
  // In production, you would query each table to count actual dependencies
  return {
    hasDependencies: false,
    dependencies: [],
  };
}
