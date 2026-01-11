import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useFuelRecords } from '@/hooks/useFuelRecords';
import { FuelForm } from '@/components/fuel/FuelForm';
import { FuelDashboard } from '@/components/fuel/FuelDashboard';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { fuelImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { useVehicles } from '@/hooks/useVehicles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FuelRecord = Tables<'fuel_records'> & { vehicles?: { plate: string; brand: string | null; model: string | null; contract_id: string | null } | null };

const columns: Column<FuelRecord>[] = [
  { key: 'date', label: 'Data', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'vehicles.plate', label: 'Veículo', render: (_, row) => row.vehicles?.plate || '-' },
  { key: 'fuel_type', label: 'Combustível' },
  { key: 'liters', label: 'Litros', render: (v) => `${Number(v).toFixed(2)} L` },
  { key: 'price_per_liter', label: 'R$/L', render: (v) => v ? `R$ ${Number(v).toFixed(2)}` : '-' },
  { key: 'total_value', label: 'Total', render: (v) => v ? `R$ ${Number(v).toFixed(2)}` : '-' },
  { key: 'station', label: 'Posto' },
  { key: 'odometer', label: 'Km', render: (v) => v ? `${Number(v).toLocaleString()} km` : '-' },
];

export default function Fuel() {
  const { records, loading, create, update, delete: deleteRecord, isCreating, isUpdating, isDeleting } = useFuelRecords();
  const { vehicles } = useVehicles();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);
  const [deleting, setDeleting] = useState<FuelRecord | null>(null);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (format === 'pdf') exportToPDF(records, exportColumns, 'Abastecimentos');
    else if (format === 'excel') exportToExcel(records, exportColumns, 'Abastecimentos');
    else exportToCSV(records, exportColumns, 'Abastecimentos');
  };

  const handleImport = async (data: any[]) => {
    const dataWithVehicle = await Promise.all(data.map(async (d) => {
      const plate = d.vehicle_plate?.toUpperCase().trim();
      const vehicle = vehicles.find(v => v.plate?.toUpperCase() === plate);
      if (!vehicle) throw new Error(`Veículo não encontrado: ${plate || 'placa não informada'}`);
      const { vehicle_plate, ...rest } = d;
      return { ...rest, vehicle_id: vehicle.id };
    }));
    const { error } = await supabase.from('fuel_records').insert(dataWithVehicle);
    if (error) throw error;
  };

  return (
    <AppLayout title="Abastecimentos">
      <div className="space-y-6">
        <PageHeader 
          title="Abastecimentos" 
          description="Controle de combustível da frota" 
          onAdd={() => { setEditing(null); setFormOpen(true); }} 
          addLabel="Novo Abastecimento" 
          onExport={handleExport}
          onImport={() => setImportOpen(true)}
        />

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="listagem">Listagem</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <FuelDashboard records={records} />
          </TabsContent>

          <TabsContent value="listagem">
            <DataTable 
              data={records} 
              columns={columns} 
              loading={loading} 
              searchPlaceholder="Buscar..." 
              onEdit={(r) => { setEditing(r); setFormOpen(true); }} 
              onDelete={setDeleting} 
            />
          </TabsContent>
        </Tabs>

        <FuelForm open={formOpen} onOpenChange={setFormOpen} onSubmit={(data) => { editing ? update({ id: editing.id, ...data }) : create(data as any); setFormOpen(false); }} initialData={editing} loading={isCreating || isUpdating} />
        <DeleteDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={() => { if (deleting) { deleteRecord(deleting.id); setDeleting(null); } }} loading={isDeleting} />
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Abastecimentos"
          description="Importe abastecimentos a partir de uma planilha Excel"
          columnMappings={fuelImportConfig.mappings}
          templateColumns={fuelImportConfig.templateColumns}
          templateFilename="abastecimentos"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
