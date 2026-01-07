import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { SatisfactionForm } from '@/components/satisfaction/SatisfactionForm';
import { useCustomerSatisfaction } from '@/hooks/useCustomerSatisfaction';
import { useContracts } from '@/hooks/useContracts';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Satisfaction() {
  const { satisfactionRecords, isLoading, deleteSatisfaction } = useCustomerSatisfaction();
  const { contracts } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

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
    { key: 'quarter', label: 'Trimestre' },
    { key: 'year', label: 'Ano' },
    {
      key: 'score',
      label: 'Nota',
      render: (value: number | null) => (value != null ? value.toFixed(1) : '-'),
    },
    { key: 'feedback', label: 'Feedback' },
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
      deleteSatisfaction(selectedRecord.id);
      setDeleteOpen(false);
      setSelectedRecord(null);
    }
  };

  const exportColumns = [
    { key: 'Contrato', label: 'Contrato' },
    { key: 'Trimestre', label: 'Trimestre' },
    { key: 'Ano', label: 'Ano' },
    { key: 'Nota', label: 'Nota' },
    { key: 'Feedback', label: 'Feedback' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = satisfactionRecords.map((r) => ({
      Contrato: getContractName(r.contract_id),
      Trimestre: r.quarter,
      Ano: r.year,
      Nota: r.score || '',
      Feedback: r.feedback || '',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Satisfação do Cliente');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'satisfacao');
    else exportToCSV(data, exportColumns, 'satisfacao');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Satisfação"
        description="Pesquisas de satisfação do cliente"
        onAdd={() => {
          setSelectedRecord(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={satisfactionRecords}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por contrato..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SatisfactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        record={selectedRecord}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Registro"
        description="Tem certeza que deseja excluir esta pesquisa de satisfação?"
      />
    </AppLayout>
  );
}
