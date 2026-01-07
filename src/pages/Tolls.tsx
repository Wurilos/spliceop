import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { TollTagForm } from '@/components/tolls/TollTagForm';
import { useTollTags } from '@/hooks/useTollTags';
import { useVehicles } from '@/hooks/useVehicles';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { tollImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Tolls() {
  const { tollTags, isLoading, deleteTollTag } = useTollTags();
  const { vehicles } = useVehicles();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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

  const exportColumns = [
    { key: 'Data/Hora', label: 'Data/Hora' },
    { key: 'Número Tag', label: 'Número Tag' },
    { key: 'Veículo', label: 'Veículo' },
    { key: 'Praça de Pedágio', label: 'Praça de Pedágio' },
    { key: 'Valor', label: 'Valor' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = tollTags.map((t) => ({
      'Data/Hora': format(new Date(t.passage_date), 'dd/MM/yyyy HH:mm'),
      'Número Tag': t.tag_number,
      Veículo: getVehiclePlate(t.vehicle_id),
      'Praça de Pedágio': t.toll_plaza || '',
      Valor: t.value,
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Tags de Pedágio');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'pedagios');
    else exportToCSV(data, exportColumns, 'pedagios');
  };

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('toll_tags').insert(data);
    if (error) throw error;
    toast.success(`${data.length} registros importados com sucesso!`);
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
        onImport={() => setImportOpen(true)}
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

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        title="Importar Passagens de Pedágio"
        columnMappings={tollImportConfig.mappings}
        templateColumns={tollImportConfig.templateColumns}
        templateFilename="template_pedagios"
      />
    </AppLayout>
  );
}
