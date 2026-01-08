import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProviderForm } from '@/components/internet/ProviderForm';
import { ConnectionForm } from '@/components/internet/ConnectionForm';
import { InternetBillForm } from '@/components/internet/InternetBillForm';
import { InternetDashboard } from '@/components/internet/InternetDashboard';
import { useInternetProviders, InternetProvider } from '@/hooks/useInternetProviders';
import { useInternetConnections, InternetConnection } from '@/hooks/useInternetConnections';
import { useInternetBills, InternetBill } from '@/hooks/useInternetBills';
import { useContracts } from '@/hooks/useContracts';

export default function Internet() {
  const { providers, isLoading: loadingProviders, deleteProvider } = useInternetProviders();
  const { connections, isLoading: loadingConnections, deleteConnection } = useInternetConnections();
  const { internetBills, isLoading: loadingBills, deleteInternetBill } = useInternetBills();
  const { contracts } = useContracts();

  const [activeTab, setActiveTab] = useState('providers');
  
  // Provider state
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [providerDeleteOpen, setProviderDeleteOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<InternetProvider | null>(null);

  // Connection state
  const [connectionFormOpen, setConnectionFormOpen] = useState(false);
  const [connectionDeleteOpen, setConnectionDeleteOpen] = useState(false);
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
      render: (value: string) => format(new Date(value), 'MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'value',
      label: 'Valor',
      render: (value: number | null) =>
        value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Internet</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="providers">Provedores</TabsTrigger>
            <TabsTrigger value="connections">Cadastro de Internet</TabsTrigger>
            <TabsTrigger value="bills">Faturas</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <PageHeader
              title="Provedores de Internet"
              onAdd={() => {
                setSelectedProvider(null);
                setProviderFormOpen(true);
              }}
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
