import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { MileageForm } from '@/components/mileage/MileageForm';
import { MileageDashboard } from '@/components/mileage/MileageDashboard';
import { useMileageRecords } from '@/hooks/useMileageRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useTeams } from '@/hooks/useTeams';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { mileageImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Mileage() {
  const { records: mileageRecords, loading: isLoading, delete: deleteMileageRecord } = useMileageRecords();
  const { vehicles } = useVehicles();
  const { teams } = useTeams();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.plate || '-';
  };

  const getTeamName = (record: any) => {
    if (record.teams?.name) return record.teams.name;
    if (!record.team_id) return '-';
    const team = teams.find((t) => t.id === record.team_id);
    return team?.name || '-';
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return '-';
    return time.substring(0, 5);
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
      key: 'start_time',
      label: 'Hora Início',
      render: (value: string | null) => formatTime(value),
    },
    { key: 'initial_km', label: 'KM Início' },
    {
      key: 'end_time',
      label: 'Hora Término',
      render: (value: string | null) => formatTime(value),
    },
    { key: 'final_km', label: 'KM Término' },
    {
      key: 'total',
      label: 'KM Rodado',
      render: (_: unknown, row: any) => row.final_km - row.initial_km,
    },
    {
      key: 'team_id',
      label: 'Equipe',
      render: (_: string | null, row: any) => getTeamName(row),
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
    { key: 'Hora Início', label: 'Hora Início' },
    { key: 'Km Início', label: 'Km Início' },
    { key: 'Hora Término', label: 'Hora Término' },
    { key: 'Km Término', label: 'Km Término' },
    { key: 'KM Rodado', label: 'KM Rodado' },
    { key: 'Equipe', label: 'Equipe' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = mileageRecords.map((r: any) => ({
      Data: format(new Date(r.date), 'dd/MM/yyyy'),
      Veículo: getVehiclePlate(r.vehicle_id),
      'Hora Início': formatTime(r.start_time),
      'Km Início': r.initial_km,
      'Hora Término': formatTime(r.end_time),
      'Km Término': r.final_km,
      'KM Rodado': r.final_km - r.initial_km,
      Equipe: getTeamName(r),
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
      <div className="space-y-6">
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

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="listagem">Listagem</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <MileageDashboard records={mileageRecords} />
          </TabsContent>

          <TabsContent value="listagem">
            <DataTable
              data={mileageRecords}
              columns={columns}
              loading={isLoading}
              searchPlaceholder="Buscar por veículo..."
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>

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
      </div>
    </AppLayout>
  );
}
