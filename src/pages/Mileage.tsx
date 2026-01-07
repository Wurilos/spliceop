import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { MileageForm } from '@/components/mileage/MileageForm';
import { useMileageRecords } from '@/hooks/useMileageRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useEmployees } from '@/hooks/useEmployees';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { mileageImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';

export default function Mileage() {
  const { records: mileageRecords, loading: isLoading, delete: deleteMileageRecord } = useMileageRecords();
  const { vehicles } = useVehicles();
  const { employees } = useEmployees();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.plate || '-';
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return '-';
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.full_name || '-';
  };

  const columns = [
    {
      key: 'date',
      label: 'Data',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'vehicle_id',
      label: 'Veículo',
      render: (value: string) => getVehiclePlate(value),
    },
    {
      key: 'employee_id',
      label: 'Colaborador',
      render: (value: string | null) => getEmployeeName(value),
    },
    { key: 'initial_km', label: 'Km Inicial' },
    { key: 'final_km', label: 'Km Final' },
    {
      key: 'total',
      label: 'Total (km)',
      render: (_: unknown, row: any) => row.final_km - row.initial_km,
    },
  ];

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setFormOpen(true);
  };

  const handleDelete = (record: any) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      deleteMileageRecord(selectedRecord.id);
      setDeleteOpen(false);
      setSelectedRecord(null);
    }
  };

  const exportColumns = [
    { key: 'Data', label: 'Data' },
    { key: 'Veículo', label: 'Veículo' },
    { key: 'Colaborador', label: 'Colaborador' },
    { key: 'Km Inicial', label: 'Km Inicial' },
    { key: 'Km Final', label: 'Km Final' },
    { key: 'Total (km)', label: 'Total (km)' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = mileageRecords.map((r) => ({
      Data: format(new Date(r.date), 'dd/MM/yyyy'),
      Veículo: getVehiclePlate(r.vehicle_id),
      Colaborador: getEmployeeName(r.employee_id),
      'Km Inicial': r.initial_km,
      'Km Final': r.final_km,
      'Total (km)': r.final_km - r.initial_km,
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Quilometragem');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'quilometragem');
    else exportToCSV(data, exportColumns, 'quilometragem');
  };

  const handleImport = async (data: any[]) => {
    const firstVehicle = vehicles[0];
    if (!firstVehicle) throw new Error('Cadastre um veículo primeiro');
    const dataWithVehicle = data.map(d => ({ ...d, vehicle_id: firstVehicle.id }));
    const { error } = await supabase.from('mileage_records').insert(dataWithVehicle);
    if (error) throw error;
  };

  return (
    <AppLayout>
      <PageHeader
        title="Quilometragem"
        description="Registros de quilometragem dos veículos"
        onAdd={() => {
          setSelectedRecord(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
        onImport={() => setImportOpen(true)}
      />

      <DataTable
        data={mileageRecords}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por veículo..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <MileageForm
        open={formOpen}
        onOpenChange={setFormOpen}
        record={selectedRecord}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Registro"
        description="Tem certeza que deseja excluir este registro de quilometragem?"
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar Quilometragem"
        description="Importe registros de quilometragem a partir de uma planilha Excel"
        columnMappings={mileageImportConfig.mappings}
        templateColumns={mileageImportConfig.templateColumns}
        templateFilename="quilometragem"
        onImport={handleImport}
      />
    </AppLayout>
  );
}
