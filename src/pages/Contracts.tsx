import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useContracts } from '@/hooks/useContracts';
import { useContractAmendments } from '@/hooks/useContractAmendments';
import { ContractForm } from '@/components/contracts/ContractForm';
import { ContractsDashboard } from '@/components/contracts/ContractsDashboard';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { contractImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

type Contract = Tables<'contracts'>;

// Tipo estendido com dados de aditivo
interface ContractWithAmendment extends Contract {
  effectiveValue: number;
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
  hasAmendment: boolean;
  amendmentCount: number;
}

const exportColumns = [
  { key: 'Cliente', label: 'Cliente' },
  { key: 'Centro de Custo', label: 'Centro de Custo' },
  { key: 'Valor Original', label: 'Valor Original' },
  { key: 'Valor Atual', label: 'Valor Atual' },
  { key: 'Data de Início', label: 'Data de Início' },
  { key: 'Data de Fim', label: 'Data de Fim' },
  { key: 'Aditivos', label: 'Aditivos' },
  { key: 'Status', label: 'Status' },
];

export default function Contracts() {
  const { contracts, loading, create, update, delete: deleteContract, deleteMany, isCreating, isUpdating, isDeleting } = useContracts();
  const { allAmendments, allLoading } = useContractAmendments();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Mescla contratos com dados de aditivos
  const contractsWithAmendments: ContractWithAmendment[] = useMemo(() => {
    return contracts.map((contract) => {
      const contractAmendments = allAmendments.filter(a => a.contract_id === contract.id);
      
      if (contractAmendments.length === 0) {
        return {
          ...contract,
          effectiveValue: Number(contract.value) || 0,
          effectiveStartDate: contract.start_date,
          effectiveEndDate: contract.end_date,
          hasAmendment: false,
          amendmentCount: 0,
        };
      }
      
      // Pega o aditivo mais recente (maior número)
      const latestAmendment = contractAmendments.reduce((prev, curr) => 
        curr.amendment_number > prev.amendment_number ? curr : prev
      );
      
      return {
        ...contract,
        effectiveValue: Number(latestAmendment.value) || Number(contract.value) || 0,
        effectiveStartDate: latestAmendment.start_date || contract.start_date,
        effectiveEndDate: latestAmendment.end_date || contract.end_date,
        hasAmendment: true,
        amendmentCount: contractAmendments.length,
      };
    });
  }, [contracts, allAmendments]);

  // Colunas dinâmicas que usam os dados enriquecidos
  const columns: Column<ContractWithAmendment>[] = useMemo(() => [
    { key: 'client_name', label: 'Cliente' },
    { key: 'cost_center', label: 'Centro de Custo' },
    {
      key: 'effectiveValue',
      label: 'Valor Atual',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              Number(value) || 0
            )}
          </span>
          {row.hasAmendment && (
            <Badge variant="secondary" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              {row.amendmentCount} {row.amendmentCount === 1 ? 'aditivo' : 'aditivos'}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'effectiveStartDate',
      label: 'Data de Início',
      render: (value) => (value ? format(new Date(String(value)), 'dd/MM/yyyy') : '-'),
    },
    {
      key: 'effectiveEndDate',
      label: 'Data de Fim',
      render: (value) => (value ? format(new Date(String(value)), 'dd/MM/yyyy') : '-'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={String(value || 'active')} />,
    },
  ], []);

  const handleAdd = () => {
    setEditingContract(null);
    setFormOpen(true);
  };

  const handleEdit = (contract: ContractWithAmendment) => {
    // Remove os campos estendidos para editar o contrato original
    const originalContract = contracts.find(c => c.id === contract.id);
    setEditingContract(originalContract || null);
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
    window.location.reload();
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const formatCurrency = (v: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    
    const data = contractsWithAmendments.map((c) => ({
      'Cliente': c.client_name,
      'Centro de Custo': c.cost_center || '',
      'Valor Original': formatCurrency(Number(c.value) || 0),
      'Valor Atual': formatCurrency(c.effectiveValue),
      'Data de Início': c.effectiveStartDate ? format(new Date(c.effectiveStartDate), 'dd/MM/yyyy') : '',
      'Data de Fim': c.effectiveEndDate ? format(new Date(c.effectiveEndDate), 'dd/MM/yyyy') : '',
      'Aditivos': c.amendmentCount,
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
              data={contractsWithAmendments}
              columns={columns}
              loading={loading || allLoading}
              searchPlaceholder="Buscar contratos..."
              onEdit={handleEdit}
              onDelete={(contract) => deleteContract(contract.id)}
              onDeleteMany={(ids) => deleteMany(ids)}
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
