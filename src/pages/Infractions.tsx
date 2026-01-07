import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { InfractionForm } from '@/components/infractions/InfractionForm';
import { useInfractions } from '@/hooks/useInfractions';
import { useEquipment } from '@/hooks/useEquipment';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Infractions() {
  const { infractions, isLoading, deleteInfraction } = useInfractions();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = infractions.map((i) => ({
      'Data/Hora': format(new Date(i.date), 'dd/MM/yyyy HH:mm'),
      Equipamento: getEquipmentSerial(i.equipment_id),
      Placa: i.plate || '',
      Velocidade: i.speed || '',
      Limite: i.limit_speed || '',
      Status: i.status || '',
    }));

    if (type === 'pdf') exportToPDF(data, 'Infrações');
    else if (type === 'excel') exportToExcel(data, 'infracoes');
    else exportToCSV(data, 'infracoes');
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
    </AppLayout>
  );
}
