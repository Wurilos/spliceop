import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { SlaForm } from '@/components/sla/SlaForm';
import { useSlaMetrics } from '@/hooks/useSlaMetrics';
import { useContracts } from '@/hooks/useContracts';
import { Badge } from '@/components/ui/badge';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Sla() {
  const { slaMetrics, isLoading, deleteSlaMetric } = useSlaMetrics();
  const { contracts } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  const getContractName = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    return contract?.client_name || '-';
  };

  const columns = [
    {
      key: 'contract_id',
      label: 'Contrato',
      render: (value: string) => getContractName(value),
    },
    {
      key: 'month',
      label: 'Mês',
      render: (value: string) => format(new Date(value), 'MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'availability',
      label: 'Disponibilidade',
      render: (value: number | null) => (value != null ? `${value.toFixed(2)}%` : '-'),
    },
    {
      key: 'response_time',
      label: 'T. Resposta (h)',
      render: (value: number | null) => (value != null ? value.toFixed(1) : '-'),
    },
    {
      key: 'resolution_time',
      label: 'T. Resolução (h)',
      render: (value: number | null) => (value != null ? value.toFixed(1) : '-'),
    },
    {
      key: 'target_met',
      label: 'Meta Atingida',
      render: (value: boolean | null) => (
        <Badge variant={value ? 'default' : 'destructive'}>
          {value ? 'Sim' : 'Não'}
        </Badge>
      ),
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
      deleteSlaMetric(selectedMetric.id);
      setDeleteOpen(false);
      setSelectedMetric(null);
    }
  };

  const exportColumns = [
    { key: 'Contrato', label: 'Contrato' },
    { key: 'Mês', label: 'Mês' },
    { key: 'Disponibilidade (%)', label: 'Disponibilidade (%)' },
    { key: 'T. Resposta (h)', label: 'T. Resposta (h)' },
    { key: 'T. Resolução (h)', label: 'T. Resolução (h)' },
    { key: 'Meta Atingida', label: 'Meta Atingida' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = slaMetrics.map((m) => ({
      Contrato: getContractName(m.contract_id),
      Mês: format(new Date(m.month), 'MM/yyyy'),
      'Disponibilidade (%)': m.availability || '',
      'T. Resposta (h)': m.response_time || '',
      'T. Resolução (h)': m.resolution_time || '',
      'Meta Atingida': m.target_met ? 'Sim' : 'Não',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Métricas SLA');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'sla');
    else exportToCSV(data, exportColumns, 'sla');
  };

  return (
    <AppLayout>
      <PageHeader
        title="SLA"
        description="Métricas de acordo de nível de serviço"
        onAdd={() => {
          setSelectedMetric(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={slaMetrics}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por contrato..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SlaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        metric={selectedMetric}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Métrica"
        description="Tem certeza que deseja excluir esta métrica de SLA?"
      />
    </AppLayout>
  );
}
