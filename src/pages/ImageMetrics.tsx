import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImageMetricForm } from '@/components/image-metrics/ImageMetricForm';
import { useImageMetrics } from '@/hooks/useImageMetrics';
import { useEquipment } from '@/hooks/useEquipment';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function ImageMetrics() {
  const { imageMetrics, isLoading, deleteImageMetric } = useImageMetrics();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  const getEquipmentSerial = (equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId);
    return eq?.serial_number || '-';
  };

  const columns = [
    {
      key: 'date',
      label: 'Data',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'equipment_id',
      label: 'Equipamento',
      render: (value: string) => getEquipmentSerial(value),
    },
    { key: 'total_captures', label: 'Total Capturas' },
    { key: 'valid_captures', label: 'Válidas' },
    {
      key: 'utilization_rate',
      label: 'Aproveitamento',
      render: (value: number | null) => (value != null ? `${value.toFixed(2)}%` : '-'),
    },
  ];

  const handleEdit = (metric: any) => {
    setSelectedMetric(metric);
    setFormOpen(true);
  };

  const handleDelete = (metric: any) => {
    setSelectedMetric(metric);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMetric) {
      deleteImageMetric(selectedMetric.id);
      setDeleteOpen(false);
      setSelectedMetric(null);
    }
  };

  const exportColumns = [
    { key: 'Data', label: 'Data' },
    { key: 'Equipamento', label: 'Equipamento' },
    { key: 'Total Capturas', label: 'Total Capturas' },
    { key: 'Válidas', label: 'Válidas' },
    { key: 'Aproveitamento (%)', label: 'Aproveitamento (%)' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = imageMetrics.map((m) => ({
      Data: format(new Date(m.date), 'dd/MM/yyyy'),
      Equipamento: getEquipmentSerial(m.equipment_id),
      'Total Capturas': m.total_captures || 0,
      Válidas: m.valid_captures || 0,
      'Aproveitamento (%)': m.utilization_rate || 0,
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Métricas de Aproveitamento');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'metricas_imagem');
    else exportToCSV(data, exportColumns, 'metricas_imagem');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Aproveitamento"
        description="Métricas de aproveitamento de imagens"
        onAdd={() => {
          setSelectedMetric(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={imageMetrics}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por equipamento..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ImageMetricForm
        open={formOpen}
        onOpenChange={setFormOpen}
        metric={selectedMetric}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Métrica"
        description="Tem certeza que deseja excluir esta métrica?"
      />
    </AppLayout>
  );
}
