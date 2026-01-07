import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EnergyForm } from '@/components/energy/EnergyForm';
import { useEnergyBills } from '@/hooks/useEnergyBills';
import { useContracts } from '@/hooks/useContracts';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Energy() {
  const { energyBills, isLoading, deleteEnergyBill } = useEnergyBills();
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
    { key: 'consumer_unit', label: 'Unidade Consumidora' },
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
      key: 'consumption_kwh',
      label: 'Consumo (kWh)',
      render: (value: number | null) => value?.toLocaleString('pt-BR') || '-',
    },
    {
      key: 'value',
      label: 'Valor',
      render: (value: number | null) =>
        value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-',
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
      deleteEnergyBill(selectedBill.id);
      setDeleteOpen(false);
      setSelectedBill(null);
    }
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = energyBills.map((b) => ({
      'Unidade Consumidora': b.consumer_unit,
      'Mês Referência': format(new Date(b.reference_month), 'MM/yyyy'),
      Contrato: getContractName(b.contract_id),
      'Consumo (kWh)': b.consumption_kwh || '',
      Valor: b.value || '',
      Status: b.status || '',
    }));

    if (type === 'pdf') exportToPDF(data, 'Contas de Energia');
    else if (type === 'excel') exportToExcel(data, 'energia');
    else exportToCSV(data, 'energia');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Energia"
        description="Gestão de contas de energia elétrica"
        onAdd={() => {
          setSelectedBill(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={energyBills}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por unidade..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EnergyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        bill={selectedBill}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Conta"
        description="Tem certeza que deseja excluir esta conta de energia?"
      />
    </AppLayout>
  );
}
