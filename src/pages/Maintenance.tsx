import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useMaintenanceRecords } from '@/hooks/useMaintenanceRecords';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { maintenanceImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { useVehicles } from '@/hooks/useVehicles';

type MaintenanceRecord = Tables<'maintenance_records'> & { vehicles?: { plate: string; brand: string | null; model: string | null } | null };

const columns: Column<MaintenanceRecord>[] = [
  { key: 'date', label: 'Data', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'vehicles.plate', label: 'Veículo', render: (_, row) => row.vehicles?.plate || '-' },
  { key: 'type', label: 'Tipo' },
  { key: 'description', label: 'Descrição', render: (v) => String(v || '-').substring(0, 30) + (String(v || '').length > 30 ? '...' : '') },
  { key: 'workshop', label: 'Oficina' },
  { key: 'cost', label: 'Custo', render: (v) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) : '-' },
  { key: 'odometer', label: 'Km', render: (v) => v ? `${Number(v).toLocaleString()} km` : '-' },
];

export default function Maintenance() {
  const { records, loading, create, update, delete: deleteRecord, isCreating, isUpdating, isDeleting } = useMaintenanceRecords();
  const { vehicles } = useVehicles();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [deleting, setDeleting] = useState<MaintenanceRecord | null>(null);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (format === 'pdf') exportToPDF(records, exportColumns, 'Manutenções');
    else if (format === 'excel') exportToExcel(records, exportColumns, 'Manutenções');
    else exportToCSV(records, exportColumns, 'Manutenções');
  };

  const handleImport = async (data: any[]) => {
    const firstVehicle = vehicles[0];
    if (!firstVehicle) throw new Error('Cadastre um veículo primeiro');
    const dataWithVehicle = data.map(d => ({ ...d, vehicle_id: firstVehicle.id }));
    const { error } = await supabase.from('maintenance_records').insert(dataWithVehicle);
    if (error) throw error;
  };

  return (
    <AppLayout title="Manutenções">
      <div className="space-y-6">
        <PageHeader 
          title="Manutenções" 
          description="Serviços e manutenções de veículos" 
          onAdd={() => { setEditing(null); setFormOpen(true); }} 
          addLabel="Nova Manutenção" 
          onExport={handleExport}
          onImport={() => setImportOpen(true)}
        />
        <DataTable data={records} columns={columns} loading={loading} searchPlaceholder="Buscar..." onEdit={(r) => { setEditing(r); setFormOpen(true); }} onDelete={setDeleting} />
        <MaintenanceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={(data) => { editing ? update({ id: editing.id, ...data }) : create(data as any); setFormOpen(false); }} initialData={editing} loading={isCreating || isUpdating} />
        <DeleteDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={() => { if (deleting) { deleteRecord(deleting.id); setDeleting(null); } }} loading={isDeleting} />
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Manutenções"
          description="Importe manutenções a partir de uma planilha Excel"
          columnMappings={maintenanceImportConfig.mappings}
          templateColumns={maintenanceImportConfig.templateColumns}
          templateFilename="manutencoes"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
