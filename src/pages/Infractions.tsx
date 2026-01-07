import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { InfractionForm } from '@/components/infractions/InfractionForm';
import { useInfractions } from '@/hooks/useInfractions';
import { useEquipment } from '@/hooks/useEquipment';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { infractionImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Infractions() {
  const { infractions, isLoading, deleteInfraction } = useInfractions();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedInfraction, setSelectedInfraction] = useState<any>(null);

  const getEquipmentSerial = (equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId);
    return eq?.serial_number || '-';
  };

  const columns = [
    {
      key: 'date',
      label: 'Data/Hora',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    {
      key: 'equipment_id',
      label: 'Equipamento',
      render: (value: string) => getEquipmentSerial(value),
    },
    { key: 'plate', label: 'Placa' },
    {
      key: 'speed',
      label: 'Velocidade',
      render: (value: number | null) => (value ? `${value} km/h` : '-'),
    },
    {
      key: 'limit_speed',
      label: 'Limite',
      render: (value: number | null) => (value ? `${value} km/h` : '-'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  const handleEdit = (infraction: any) => {
    setSelectedInfraction(infraction);
    setFormOpen(true);
  };

  const handleDelete = (infraction: any) => {
    setSelectedInfraction(infraction);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInfraction) {
      deleteInfraction(selectedInfraction.id);
      setDeleteOpen(false);
      setSelectedInfraction(null);
    }
  };

  const exportColumns = [
    { key: 'Data/Hora', label: 'Data/Hora' },
    { key: 'Equipamento', label: 'Equipamento' },
    { key: 'Placa', label: 'Placa' },
    { key: 'Velocidade', label: 'Velocidade' },
    { key: 'Limite', label: 'Limite' },
    { key: 'Status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = infractions.map((i) => ({
      'Data/Hora': format(new Date(i.date), 'dd/MM/yyyy HH:mm'),
      Equipamento: getEquipmentSerial(i.equipment_id),
      Placa: i.plate || '',
      Velocidade: i.speed || '',
      Limite: i.limit_speed || '',
      Status: i.status || '',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Infrações');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'infracoes');
    else exportToCSV(data, exportColumns, 'infracoes');
  };

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('infractions').insert(data);
    if (error) throw error;
    toast.success(`${data.length} registros importados com sucesso!`);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Infrações"
        description="Registro de infrações detectadas"
        onAdd={() => {
          setSelectedInfraction(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
        onImport={() => setImportOpen(true)}
      />

      <DataTable
        data={infractions}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por placa..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <InfractionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        infraction={selectedInfraction}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Infração"
        description="Tem certeza que deseja excluir esta infração?"
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        title="Importar Infrações"
        columnMappings={infractionImportConfig.mappings}
        templateColumns={infractionImportConfig.templateColumns}
        templateFilename="template_infracoes"
      />
    </AppLayout>
  );
}
