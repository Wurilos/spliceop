import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useContracts } from '@/hooks/useContracts';
import { ContractForm } from '@/components/contracts/ContractForm';
import { ContractsDashboard } from '@/components/contracts/ContractsDashboard';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { contractImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Contract = Tables<'contracts'>;

const columns: Column<Contract>[] = [
  { key: 'client_name', label: 'Cliente' },
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
    label: 'Data de Início',
    render: (value) => (value ? format(new Date(String(value)), 'dd/MM/yyyy') : '-'),
  },
  {
    key: 'end_date',
    label: 'Data de Fim',
    render: (value) => (value ? format(new Date(String(value)), 'dd/MM/yyyy') : '-'),
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={String(value || 'active')} />,
  },
];

const exportColumns = [
  { key: 'Cliente', label: 'Cliente' },
  { key: 'Valor', label: 'Valor' },
  { key: 'Data de Início', label: 'Data de Início' },
  { key: 'Data de Fim', label: 'Data de Fim' },
  { key: 'Status', label: 'Status' },
];

export default function Contracts() {
  const { contracts, loading, create, update, delete: deleteContract, deleteMany, isCreating, isUpdating, isDeleting } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const handleAdd = () => {
    setEditingContract(null);
    setFormOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormOpen(true);
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

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('contracts').insert(data);
    if (error) throw error;
    // Força o refetch da lista após importação
    window.location.reload();
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = contracts.map((c) => ({
      'Cliente': c.client_name,
      'Valor': c.value || 0,
      'Data de Início': c.start_date || '',
      'Data de Fim': c.end_date || '',
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

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="listagem">Listagem</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <ContractsDashboard />
          </TabsContent>

          <TabsContent value="listagem" className="mt-4">
            <DataTable
              data={contracts}
              columns={columns}
              loading={loading}
              searchPlaceholder="Buscar contratos..."
              onEdit={handleEdit}
              onDelete={(contract) => deleteContract(contract.id)}
              onDeleteMany={deleteMany}
              entityName="contrato"
            />
          </TabsContent>
        </Tabs>

        <ContractForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingContract}
          loading={isCreating || isUpdating}
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
