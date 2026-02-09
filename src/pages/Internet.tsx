import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProviderForm } from '@/components/internet/ProviderForm';
import { ConnectionForm } from '@/components/internet/ConnectionForm';
import { InternetBillForm } from '@/components/internet/InternetBillForm';
import { InternetDashboard } from '@/components/internet/InternetDashboard';
import { InternetBillingStatusGrid } from '@/components/internet/InternetBillingStatusGrid';
import { useInternetProviders, InternetProvider } from '@/hooks/useInternetProviders';
import { useInternetConnections, InternetConnection } from '@/hooks/useInternetConnections';
import { useInternetBills, InternetBill } from '@/hooks/useInternetBills';
import { useContracts } from '@/hooks/useContracts';
import { supabase } from '@/integrations/supabase/client';
import { 
  internetProviderImportConfig, 
  internetConnectionImportConfig 
} from '@/lib/importConfigs';

export default function Internet() {
  const queryClient = useQueryClient();
  const { providers, isLoading: loadingProviders, deleteProvider } = useInternetProviders();
  const { connections, isLoading: loadingConnections, deleteConnection } = useInternetConnections();
  const { internetBills, isLoading: loadingBills, deleteInternetBill } = useInternetBills();
  const { contracts } = useContracts();

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Provider state
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [providerDeleteOpen, setProviderDeleteOpen] = useState(false);
  const [providerImportOpen, setProviderImportOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<InternetProvider | null>(null);

  // Connection state
  const [connectionFormOpen, setConnectionFormOpen] = useState(false);
  const [connectionDeleteOpen, setConnectionDeleteOpen] = useState(false);
  const [connectionImportOpen, setConnectionImportOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<InternetConnection | null>(null);

  // Bill state
  const [billFormOpen, setBillFormOpen] = useState(false);
  const [billDeleteOpen, setBillDeleteOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<InternetBill | null>(null);

  // Provider columns
  const providerColumns = [
    { key: 'name', label: 'Provedor' },
    { key: 'address', label: 'Endereço', render: (v: string | null) => v || '-' },
    { key: 'city', label: 'Município', render: (v: string | null) => v || '-' },
  ];

  // Connection columns
  const connectionColumns = [
    { 
      key: 'contract_id', 
      label: 'Contrato',
      render: (v: string | null) => {
        const contract = contracts.find(c => c.id === v);
        return contract ? `${contract.number} - ${contract.client_name}` : '-';
      }
    },
    { key: 'serial_number', label: 'Número de Série' },
    { 
      key: 'provider_id', 
      label: 'Provedor',
      render: (v: string | null) => {
        const provider = providers.find(p => p.id === v);
        return provider?.name || '-';
      }
    },
    { key: 'client_code', label: 'Código do Cliente', render: (v: string | null) => v || '-' },
  ];

  // Bill columns
  const billColumns = [
    { key: 'provider', label: 'Provedor' },
    {
      key: 'reference_month',
      label: 'Mês Referência',
      render: (value: string) => {
        const [year, month] = value.split('-').map(Number);
        return `${String(month).padStart(2, '0')}/${year}`;
      },
    },
    {
      key: 'value',
      label: 'Valor',
      render: (value: number | null) =>
        value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-',
    },
  ];

  // Import handlers
  const handleProviderImport = async (data: Record<string, any>[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
      try {
        const providerData = {
          name: row.name,
          address: row.address || null,
          city: row.city || null,
        };

        const { error } = await supabase
          .from('internet_providers')
          .insert(providerData);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error('Error importing provider:', error);
        errorCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['internet_providers'] });
    
    if (errorCount > 0) {
      toast.warning(`Importação concluída: ${successCount} sucessos, ${errorCount} erros`);
    } else {
      toast.success(`${successCount} provedores importados com sucesso!`);
    }
  };

  const handleConnectionImport = async (data: Record<string, any>[]) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Resolve contract_id from contract_ref (number or client_name)
        let contractId: string | null = null;
        if (row.contract_ref) {
          const contractRef = String(row.contract_ref).toLowerCase().trim();
          const contract = contracts.find(c => 
            c.number.toLowerCase() === contractRef || 
            c.client_name.toLowerCase() === contractRef
          );
          if (contract) {
            contractId = contract.id;
          } else {
            errors.push(`Contrato não encontrado: ${row.contract_ref}`);
          }
        }

        // Resolve provider_id from provider_name
        let providerId: string | null = null;
        if (row.provider_name) {
          const providerName = String(row.provider_name).toLowerCase().trim();
          const provider = providers.find(p => 
            p.name.toLowerCase() === providerName
          );
          if (provider) {
            providerId = provider.id;
          } else {
            errors.push(`Provedor não encontrado: ${row.provider_name}`);
          }
        }

        const connectionData = {
          serial_number: row.serial_number,
          contract_id: contractId,
          provider_id: providerId,
          client_code: row.client_code || null,
        };

        const { error } = await supabase
          .from('internet_connections')
          .insert(connectionData);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error('Error importing connection:', error);
        errorCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['internet_connections'] });
    
    if (errorCount > 0 || errors.length > 0) {
      toast.warning(`Importação: ${successCount} sucessos, ${errorCount} erros`);
      if (errors.length > 0) {
        console.warn('Import warnings:', errors);
      }
    } else {
      toast.success(`${successCount} cadastros importados com sucesso!`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Internet</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="status-grid">Grade de Status</TabsTrigger>
            <TabsTrigger value="providers">Provedores</TabsTrigger>
            <TabsTrigger value="connections">Cadastro de Internet</TabsTrigger>
            <TabsTrigger value="bills">Faturas</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <PageHeader
              title="Provedores de Internet"
              onAdd={() => {
                setSelectedProvider(null);
                setProviderFormOpen(true);
              }}
              onImport={() => setProviderImportOpen(true)}
            />
            <DataTable
              data={providers}
              columns={providerColumns}
              loading={loadingProviders}
              searchPlaceholder="Buscar provedores..."
              onEdit={(p) => {
                setSelectedProvider(p);
                setProviderFormOpen(true);
              }}
              onDelete={(p) => {
                setSelectedProvider(p);
                setProviderDeleteOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <PageHeader
              title="Cadastro de Internet"
              onAdd={() => {
                setSelectedConnection(null);
                setConnectionFormOpen(true);
              }}
              onImport={() => setConnectionImportOpen(true)}
            />
            <DataTable
              data={connections}
              columns={connectionColumns}
              loading={loadingConnections}
              searchPlaceholder="Buscar cadastros..."
              onEdit={(c) => {
                setSelectedConnection(c);
                setConnectionFormOpen(true);
              }}
              onDelete={(c) => {
                setSelectedConnection(c);
                setConnectionDeleteOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            <PageHeader
              title="Faturas de Internet"
              onAdd={() => {
                setSelectedBill(null);
                setBillFormOpen(true);
              }}
            />
            <DataTable
              data={internetBills}
              columns={billColumns}
              loading={loadingBills}
              searchPlaceholder="Buscar faturas..."
              onEdit={(b) => {
                setSelectedBill(b);
                setBillFormOpen(true);
              }}
              onDelete={(b) => {
                setSelectedBill(b);
                setBillDeleteOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="dashboard">
            <InternetDashboard />
          </TabsContent>

          <TabsContent value="status-grid">
            <InternetBillingStatusGrid
              connections={connections.map(c => ({
                ...c,
                contracts: contracts.find(ct => ct.id === c.contract_id) || null,
                providers: providers.find(p => p.id === c.provider_id) || null,
              }))}
              internetBills={internetBills.map(b => ({
                ...b,
                connection_id: (b as any).connection_id || null,
              }))}
              contracts={contracts}
              onCreateBill={(connectionId, referenceMonth) => {
                setSelectedBill(null);
                setBillFormOpen(true);
              }}
              onEditBill={(bill) => {
                const fullBill = internetBills.find(b => b.id === bill.id);
                setSelectedBill(fullBill || null);
                setBillFormOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Provider dialogs */}
      <ProviderForm
        open={providerFormOpen}
        onOpenChange={setProviderFormOpen}
        provider={selectedProvider}
      />
      <DeleteDialog
        open={providerDeleteOpen}
        onOpenChange={setProviderDeleteOpen}
        onConfirm={() => {
          if (selectedProvider) {
            deleteProvider(selectedProvider.id);
            setProviderDeleteOpen(false);
          }
        }}
        title="Excluir Provedor"
        description="Tem certeza que deseja excluir este provedor?"
      />
      <ImportDialog
        open={providerImportOpen}
        onOpenChange={setProviderImportOpen}
        title="Importar Provedores"
        description="Importe provedores de internet a partir de um arquivo Excel."
        columnMappings={internetProviderImportConfig.mappings}
        templateColumns={internetProviderImportConfig.templateColumns}
        templateFilename="modelo_provedores_internet"
        onImport={handleProviderImport}
      />

      {/* Connection dialogs */}
      <ConnectionForm
        open={connectionFormOpen}
        onOpenChange={setConnectionFormOpen}
        connection={selectedConnection}
      />
      <DeleteDialog
        open={connectionDeleteOpen}
        onOpenChange={setConnectionDeleteOpen}
        onConfirm={() => {
          if (selectedConnection) {
            deleteConnection(selectedConnection.id);
            setConnectionDeleteOpen(false);
          }
        }}
        title="Excluir Cadastro"
        description="Tem certeza que deseja excluir este cadastro?"
      />
      <ImportDialog
        open={connectionImportOpen}
        onOpenChange={setConnectionImportOpen}
        title="Importar Cadastros de Internet"
        description="Importe cadastros de internet. O sistema resolve automaticamente contratos e provedores pelos nomes."
        columnMappings={internetConnectionImportConfig.mappings}
        templateColumns={internetConnectionImportConfig.templateColumns}
        templateFilename="modelo_cadastro_internet"
        onImport={handleConnectionImport}
      />

      {/* Bill dialogs */}
      <InternetBillForm
        open={billFormOpen}
        onOpenChange={setBillFormOpen}
        bill={selectedBill}
      />
      <DeleteDialog
        open={billDeleteOpen}
        onOpenChange={setBillDeleteOpen}
        onConfirm={() => {
          if (selectedBill) {
            deleteInternetBill(selectedBill.id);
            setBillDeleteOpen(false);
          }
        }}
        title="Excluir Fatura"
        description="Tem certeza que deseja excluir esta fatura?"
      />
    </AppLayout>
  );
}
