import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useVehicles } from '@/hooks/useVehicles';
import { VehicleForm } from '@/components/vehicles/VehicleForm';
import { Tables } from '@/integrations/supabase/types';
import { vehicleImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

type Vehicle = Tables<'vehicles'> & { contracts?: { number: string; client_name: string } | null };

const columns: Column<Vehicle>[] = [
  { key: 'plate', label: 'Placa' },
  { key: 'brand', label: 'Marca' },
  { key: 'model', label: 'Modelo' },
  { key: 'year', label: 'Ano' },
  { key: 'color', label: 'Cor' },
  { key: 'fuel_card', label: 'Cartão Comb.' },
  {
    key: 'contracts.client_name',
    label: 'Contrato',
    render: (_, row) => row.contracts?.client_name || '-',
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={String(value || 'active')} />,
  },
];

const exportColumns = [
  { key: 'Placa', label: 'Placa' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Modelo', label: 'Modelo' },
  { key: 'Ano', label: 'Ano' },
  { key: 'Cor', label: 'Cor' },
  { key: 'Status', label: 'Status' },
];

export default function Vehicles() {
  const { vehicles, loading, create, update, delete: deleteVehicle, deleteMany, isCreating, isUpdating } = useVehicles();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: Partial<Vehicle>) => {
    if (editingVehicle) {
      update({ id: editingVehicle.id, ...data });
    } else {
      create(data as any);
    }
    setFormOpen(false);
    setEditingVehicle(null);
  };

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('vehicles').insert(data);
    if (error) throw error;
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = vehicles.map((v) => ({
      'Placa': v.plate,
      'Marca': v.brand || '',
      'Modelo': v.model || '',
      'Ano': v.year || '',
      'Cor': v.color || '',
      'Status': v.status || '',
    }));
    if (type === 'pdf') exportToPDF(data, exportColumns, 'Veículos');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'veiculos');
    else exportToCSV(data, exportColumns, 'veiculos');
  };

  return (
    <AppLayout title="Veículos">
      <div className="space-y-6">
        <PageHeader
          title="Veículos"
          description="Gerencie a frota operacional"
          onAdd={handleAdd}
          addLabel="Novo Veículo"
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
        />

        <DataTable
          data={vehicles}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar veículos..."
          onEdit={handleEdit}
          onDelete={(vehicle) => deleteVehicle(vehicle.id)}
          onDeleteMany={deleteMany}
          entityName="veículo"
        />

        <VehicleForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingVehicle}
          loading={isCreating || isUpdating}
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Veículos"
          description="Importe veículos a partir de uma planilha Excel"
          columnMappings={vehicleImportConfig.mappings}
          templateColumns={vehicleImportConfig.templateColumns}
          templateFilename="veiculos"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
