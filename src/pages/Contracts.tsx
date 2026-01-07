import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { useContracts } from '@/hooks/useContracts';
import { ContractForm } from '@/components/contracts/ContractForm';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Contract = Tables<'contracts'>;

const columns: Column<Contract>[] = [
  { key: 'number', label: 'Número' },
  { key: 'client_name', label: 'Cliente' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'UF' },
  {
    key: 'value',
    label: 'Valor',
    render: (value) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        Number(value) || 0
      ),
  },
  {
    key: 'start_date',
    label: 'Início',
    render: (value) => (value ? format(new Date(String(value)), 'dd/MM/yyyy') : '-'),
  },
  {
    key: 'end_date',
    label: 'Término',
    render: (value) => (value ? format(new Date(String(value)), 'dd/MM/yyyy') : '-'),
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={String(value || 'active')} />,
  },
];

export default function Contracts() {
  const { contracts, loading, create, update, delete: deleteContract, isCreating, isUpdating, isDeleting } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);

  const handleAdd = () => {
    setEditingContract(null);
    setFormOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormOpen(true);
  };

  const handleDelete = (contract: Contract) => {
    setDeletingContract(contract);
  };

  const handleFormSubmit = (data: Partial<Contract>) => {
    if (editingContract) {
      update({ id: editingContract.id, ...data });
    } else {
      create(data as any);
    }
    setFormOpen(false);
    setEditingContract(null);
  };

  const handleConfirmDelete = () => {
    if (deletingContract) {
      deleteContract(deletingContract.id);
      setDeletingContract(null);
    }
  };

  return (
    <AppLayout title="Contratos">
      <div className="space-y-6">
        <PageHeader
          title="Contratos"
          description="Gerencie os contratos com clientes"
          onAdd={handleAdd}
          addLabel="Novo Contrato"
        />

        <DataTable
          data={contracts}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar contratos..."
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <ContractForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingContract}
          loading={isCreating || isUpdating}
        />

        <DeleteDialog
          open={!!deletingContract}
          onOpenChange={(open) => !open && setDeletingContract(null)}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
