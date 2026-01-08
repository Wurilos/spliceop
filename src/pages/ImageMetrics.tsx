import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { ImageMetricForm } from '@/components/image-metrics/ImageMetricForm';
import { ImageMetricsDashboard } from '@/components/image-metrics/ImageMetricsDashboard';
import { useImageMetrics } from '@/hooks/useImageMetrics';
import { useEquipment } from '@/hooks/useEquipment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { imageMetricImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ImageMetrics() {
  const { imageMetrics, isLoading, deleteImageMetric } = useImageMetrics();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('image_metrics').insert(data);
    if (error) throw error;
    toast.success(`${data.length} registros importados com sucesso!`);
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
        onImport={() => setImportOpen(true)}
      />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="list">Listagem</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ImageMetricsDashboard />
        </TabsContent>

        <TabsContent value="list">
          <DataTable
            data={imageMetrics}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Buscar por equipamento..."
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

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

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        title="Importar Métricas de Aproveitamento"
        columnMappings={imageMetricImportConfig.mappings}
        templateColumns={imageMetricImportConfig.templateColumns}
        templateFilename="template_metricas_imagem"
      />
    </AppLayout>
  );
}
