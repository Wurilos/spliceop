import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useContracts } from '@/hooks/useContracts';
import { ContractForm } from '@/components/contracts/ContractForm';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { contractImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

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

const exportColumns = [
  { key: 'Número', label: 'Número' },
  { key: 'Cliente', label: 'Cliente' },
  { key: 'Cidade', label: 'Cidade' },
  { key: 'UF', label: 'UF' },
  { key: 'Valor', label: 'Valor' },
  { key: 'Status', label: 'Status' },
];

export default function Contracts() {
  const { contracts, loading, create, update, delete: deleteContract, isCreating, isUpdating, isDeleting } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('contracts').insert(data);
    if (error) throw error;
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = contracts.map((c) => ({
      'Número': c.number,
      'Cliente': c.client_name,
      'Cidade': c.city || '',
      'UF': c.state || '',
      'Valor': c.value || 0,
      'Status': c.status || '',
    }));
    if (type === 'pdf') exportToPDF(data, exportColumns, 'Contratos');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'contratos');
    else exportToCSV(data, exportColumns, 'contratos');
  };

  return (
    <AppLayout title="Contratos">
      <div className="space-y-6">
        <PageHeader
          title="Contratos"
          description="Gerencie os contratos com clientes"
          onAdd={handleAdd}
          addLabel="Novo Contrato"
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
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

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Contratos"
          description="Importe contratos a partir de uma planilha Excel"
          columnMappings={contractImportConfig.mappings}
          templateColumns={contractImportConfig.templateColumns}
          templateFilename="contratos"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
