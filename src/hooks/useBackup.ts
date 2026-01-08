import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackupData {
  version: string;
  created_at: string;
  tables: Record<string, unknown[]>;
}

const BACKUP_TABLES = [
  'contracts',
  'employees',
  'equipment',
  'vehicles',
  'fuel_records',
  'mileage_records',
  'maintenance_records',
  'calibrations',
  'service_calls',
  'invoices',
  'energy_bills',
  'energy_suppliers',
  'energy_consumer_units',
  'internet_bills',
  'advances',
  'toll_tags',
  'image_metrics',
  'infractions',
  'customer_satisfaction',
  'sla_metrics',
  'service_goals',
  'pending_issues',
  'seals',
  'seal_service_orders',
  'inventory',
  'components',
  'stock',
  'stock_maintenance',
  'infrastructure_services',
  'phone_lines',
  'kanban_columns',
];

export function useBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportBackup = async () => {
    setIsExporting(true);
    try {
      const backupData: BackupData = {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        tables: {},
      };

      for (const tableName of BACKUP_TABLES) {
        const { data, error } = await supabase
          .from(tableName as 'contracts')
          .select('*');

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          continue;
        }

        backupData.tables[tableName] = data || [];
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting backup:', error);
      toast.error('Erro ao exportar backup');
    } finally {
      setIsExporting(false);
    }
  };

  const importBackup = async (file: File): Promise<boolean> => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      if (!backupData.version || !backupData.tables) {
        toast.error('Arquivo de backup inválido');
        return false;
      }

      // Process tables in order (respecting foreign keys)
      const orderedTables = [
        'contracts',
        'employees',
        'equipment',
        'vehicles',
        'components',
        'kanban_columns',
        'energy_suppliers',
        'energy_consumer_units',
        ...BACKUP_TABLES.filter(
          (t) =>
            ![
              'contracts',
              'employees',
              'equipment',
              'vehicles',
              'components',
              'kanban_columns',
              'energy_suppliers',
              'energy_consumer_units',
            ].includes(t)
        ),
      ];

      for (const tableName of orderedTables) {
        const tableData = backupData.tables[tableName];
        if (!tableData || tableData.length === 0) continue;

        // Delete existing data
        const { error: deleteError } = await supabase
          .from(tableName as 'contracts')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
          console.error(`Error deleting ${tableName}:`, deleteError);
        }

        // Insert backup data
        const { error: insertError } = await supabase
          .from(tableName as 'contracts')
          .insert(tableData as never[]);

        if (insertError) {
          console.error(`Error inserting ${tableName}:`, insertError);
        }
      }

      toast.success('Backup restaurado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error importing backup:', error);
      toast.error('Erro ao restaurar backup');
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    exportBackup,
    importBackup,
    isExporting,
    isImporting,
  };
}
