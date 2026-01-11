import { useState, useMemo } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Mileage() {
  const { records: mileageRecords, loading: isLoading, delete: deleteMileageRecord } = useMileageRecords();
  const { vehicles } = useVehicles();
  const { teams } = useTeams();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const filteredRecords = useMemo(() => {
    return mileageRecords
      .filter((record: any) => {
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        if (selectedVehicle && record.vehicle_id !== selectedVehicle) return false;
        if (selectedTeam && record.team_id !== selectedTeam) return false;
        return true;
      })
      .map((record: any) => ({
        ...record,
        vehicle_plate: record.vehicles?.plate || vehicles.find(v => v.id === record.vehicle_id)?.plate || '-',
        team_name: record.teams?.name || teams.find(t => t.id === record.team_id)?.name || '-',
      }));
  }, [mileageRecords, startDate, endDate, selectedVehicle, selectedTeam, vehicles, teams]);

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

  const formatDate = (dateStr: string) => {
    // Parse date as local time to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const columns = [
    {
      key: 'date',
      label: 'Data',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'vehicle_plate',
      label: 'Veículo',
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
      key: 'team_name',
      label: 'Equipe',
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

          <TabsContent value="listagem" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Início</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Fim</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Veículo</label>
                    <Select value={selectedVehicle} onValueChange={(v) => setSelectedVehicle(v === '_all' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os veículos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todos os veículos</SelectItem>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Equipe</label>
                    <Select value={selectedTeam} onValueChange={(v) => setSelectedTeam(v === '_all' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as equipes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">Todas as equipes</SelectItem>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <DataTable
              data={filteredRecords}
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
