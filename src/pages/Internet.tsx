import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { InternetForm } from '@/components/internet/InternetForm';
import { useInternetBills } from '@/hooks/useInternetBills';
import { useContracts } from '@/hooks/useContracts';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Internet() {
  const { internetBills, isLoading, deleteInternetBill } = useInternetBills();
  const { contracts } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const getContractName = (contractId: string | null) => {
    if (!contractId) return '-';
    const contract = contracts.find((c) => c.id === contractId);
    return contract?.client_name || '-';
  };

  const columns = [
    { key: 'provider', label: 'Provedor' },
    {
      key: 'reference_month',
      label: 'Mês Referência',
      render: (value: string) => format(new Date(value), 'MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'contract_id',
      label: 'Contrato',
      render: (value: string | null) => getContractName(value),
    },
    {
      key: 'value',
      label: 'Valor',
      render: (value: number | null) =>
        value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-',
    },
    {
      key: 'due_date',
      label: 'Vencimento',
      render: (value: string | null) =>
        value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  const handleEdit = (bill: any) => {
    setSelectedBill(bill);
    setFormOpen(true);
  };

  const handleDelete = (bill: any) => {
    setSelectedBill(bill);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBill) {
      deleteInternetBill(selectedBill.id);
      setDeleteOpen(false);
      setSelectedBill(null);
    }
  };

  const exportColumns = [
    { key: 'Provedor', label: 'Provedor' },
    { key: 'Mês Referência', label: 'Mês Referência' },
    { key: 'Contrato', label: 'Contrato' },
    { key: 'Valor', label: 'Valor' },
    { key: 'Vencimento', label: 'Vencimento' },
    { key: 'Status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = internetBills.map((b) => ({
      Provedor: b.provider,
      'Mês Referência': format(new Date(b.reference_month), 'MM/yyyy'),
      Contrato: getContractName(b.contract_id),
      Valor: b.value || '',
      Vencimento: b.due_date || '',
      Status: b.status || '',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Contas de Internet');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'internet');
    else exportToCSV(data, exportColumns, 'internet');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Internet"
        description="Gestão de contas de internet"
        onAdd={() => {
          setSelectedBill(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={internetBills}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por provedor..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <InternetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        bill={selectedBill}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Conta"
        description="Tem certeza que deseja excluir esta conta de internet?"
      />
    </AppLayout>
  );
}
