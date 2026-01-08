import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DependencyResult {
  hasDependencies: boolean;
  dependencies: {
    table: string;
    count: number;
    label: string;
  }[];
  loading: boolean;
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

export type DependencyTableName = keyof typeof dependencyMap;

export function useDependencyCheck() {
  const [result, setResult] = useState<DependencyResult>({
    hasDependencies: false,
    dependencies: [],
    loading: false,
  });

  const checkDependencies = async (
    tableName: DependencyTableName,
    recordId: string
  ): Promise<DependencyResult> => {
    const deps = dependencyMap[tableName];
    
    if (!deps || deps.length === 0) {
      return { hasDependencies: false, dependencies: [], loading: false };
    }

    setResult(prev => ({ ...prev, loading: true }));
    const dependencies: DependencyResult['dependencies'] = [];

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        setResult({ hasDependencies: false, dependencies: [], loading: false });
        return { hasDependencies: false, dependencies: [], loading: false };
      }

      await Promise.all(
        deps.map(async (dep) => {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${dep.table}?${dep.column}=eq.${recordId}&select=id`,
              {
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data && data.length > 0) {
                dependencies.push({
                  table: dep.table,
                  count: data.length,
                  label: dep.label,
                });
              }
            }
          } catch {
            // Ignore errors for individual dependency checks
          }
        })
      );

      const finalResult = {
        hasDependencies: dependencies.length > 0,
        dependencies,
        loading: false,
      };
      
      setResult(finalResult);
      return finalResult;
    } catch {
      setResult({ hasDependencies: false, dependencies: [], loading: false });
      return { hasDependencies: false, dependencies: [], loading: false };
    }
  };

  const resetDependencies = () => {
    setResult({ hasDependencies: false, dependencies: [], loading: false });
  };

  return {
    ...result,
    checkDependencies,
    resetDependencies,
  };
}
