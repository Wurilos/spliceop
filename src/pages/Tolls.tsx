import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { TollTagForm } from '@/components/tolls/TollTagForm';
import { useTollTags } from '@/hooks/useTollTags';
import { useVehicles } from '@/hooks/useVehicles';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Tolls() {
  const { tollTags, isLoading, deleteTollTag } = useTollTags();
  const { vehicles } = useVehicles();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.plate || '-';
  };

  const columns = [
    {
      key: 'passage_date',
      label: 'Data/Hora',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    { key: 'tag_number', label: 'Número Tag' },
    {
      key: 'vehicle_id',
      label: 'Veículo',
      render: (value: string) => getVehiclePlate(value),
    },
    { key: 'toll_plaza', label: 'Praça de Pedágio' },
    {
      key: 'value',
      label: 'Valor',
      render: (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
  ];

  const handleEdit = (tag: any) => {
    setSelectedTag(tag);
    setFormOpen(true);
  };

  const handleDelete = (tag: any) => {
    setSelectedTag(tag);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTag) {
      deleteTollTag(selectedTag.id);
      setDeleteOpen(false);
      setSelectedTag(null);
    }
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = tollTags.map((t) => ({
      'Data/Hora': format(new Date(t.passage_date), 'dd/MM/yyyy HH:mm'),
      'Número Tag': t.tag_number,
      Veículo: getVehiclePlate(t.vehicle_id),
      'Praça de Pedágio': t.toll_plaza || '',
      Valor: t.value,
    }));

    if (type === 'pdf') exportToPDF(data, 'Tags de Pedágio');
    else if (type === 'excel') exportToExcel(data, 'pedagios');
    else exportToCSV(data, 'pedagios');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Tags Pedágio"
        description="Gestão de passagens de pedágio"
        onAdd={() => {
          setSelectedTag(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={tollTags}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por tag ou praça..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TollTagForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tag={selectedTag}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Passagem"
        description="Tem certeza que deseja excluir esta passagem de pedágio?"
      />
    </AppLayout>
  );
}
