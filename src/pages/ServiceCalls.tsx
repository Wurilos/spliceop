import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useServiceCalls } from '@/hooks/useServiceCalls';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { useEmployees } from '@/hooks/useEmployees';
import { ServiceCallForm } from '@/components/service-calls/ServiceCallForm';
import { ServiceCallsDashboard } from '@/components/service-calls/ServiceCallsDashboard';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { serviceCallImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ServiceCall = Tables<'service_calls'> & { 
  contracts?: { number: string; client_name: string } | null;
  equipment?: { serial_number: string } | null;
  employees?: { full_name: string } | null;
};

const columns: Column<ServiceCall>[] = [
  { key: 'date', label: 'Data', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'contracts.client_name', label: 'Contrato', render: (_, row) => row.contracts?.client_name || '-' },
  { key: 'third_party_contract', label: 'Contrato Terceiros', render: (v) => String(v || '-') },
  { key: 'equipment.serial_number', label: 'Equipamento', render: (_, row) => row.equipment?.serial_number || '-' },
  { key: 'employees.full_name', label: 'Colaborador', render: (_, row) => row.employees?.full_name || '-' },
  { key: 'type', label: 'Tipo de Atendimento' },
  { key: 'mob_code', label: 'Cód. Mob', render: (v) => String(v || '-') },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v || 'open')} /> },
];

export default function ServiceCalls() {
  const { toast } = useToast();
  const { serviceCalls, loading, create, update, delete: deleteRecord, isCreating, isUpdating, isDeleting } = useServiceCalls();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const { employees } = useEmployees();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCall | null>(null);
  const [deleting, setDeleting] = useState<ServiceCall | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (format === 'pdf') exportToPDF(serviceCalls, exportColumns, 'Atendimentos');
    else if (format === 'excel') exportToExcel(serviceCalls, exportColumns, 'Atendimentos');
    else exportToCSV(serviceCalls, exportColumns, 'Atendimentos');
  };

  const handleImport = async (data: any[]) => {
    // Buscar contrato "Infraestrutura" (fallback)
    const infraContract = contracts.find(c => 
      c.client_name.toLowerCase().includes('infraestrutura') || 
      c.number.toLowerCase().includes('infraestrutura')
    );

    // Criar mapas de lookup
    const contractMap = new Map<string, string>();
    contracts.forEach(c => {
      contractMap.set(c.number.toLowerCase().trim(), c.id);
      contractMap.set(c.client_name.toLowerCase().trim(), c.id);
    });

    const equipmentMap = new Map<string, string>();
    equipment.forEach(e => {
      equipmentMap.set(e.serial_number.toLowerCase().trim(), e.id);
    });

    const employeeMap = new Map<string, string>();
    employees.forEach(e => {
      employeeMap.set(e.full_name.toLowerCase().trim(), e.id);
    });

    let thirdPartyCount = 0;

    // Processar cada registro
    const processedData = data.map(row => {
      const contractRef = row.contract_ref?.toLowerCase().trim();
      let contractId = contractRef ? contractMap.get(contractRef) : null;
      let thirdPartyContract = row.third_party_contract || null;

      // Se contrato não encontrado, vincular a Infraestrutura e preencher third_party_contract
      if (contractRef && !contractId) {
        contractId = infraContract?.id || null;
        thirdPartyContract = row.contract_ref;
        thirdPartyCount++;
      }

      // Resolver equipamento pelo serial
      const equipmentSerial = row.equipment_serial?.toLowerCase().trim();
      const equipmentId = equipmentSerial ? equipmentMap.get(equipmentSerial) : null;

      // Resolver colaborador pelo nome
      const employeeName = row.employee_name?.toLowerCase().trim();
      const employeeId = employeeName ? employeeMap.get(employeeName) : null;

      return {
        date: row.date,
        type: row.type || null,
        description: row.description || null,
        resolution: row.resolution || null,
        status: row.status || 'open',
        mob_code: row.mob_code || null,
        contract_id: contractId,
        third_party_contract: thirdPartyContract,
        equipment_id: equipmentId,
        employee_id: employeeId,
      };
    });

    const { error } = await supabase.from('service_calls').insert(processedData);
    if (error) throw error;

    if (thirdPartyCount > 0) {
      toast({
        title: 'Importação concluída',
        description: `${processedData.length} atendimentos importados. ${thirdPartyCount} vinculados como "Contrato Terceiros".`,
      });
    }
  };

  return (
    <AppLayout title="Atendimentos">
      <div className="space-y-6">
        <PageHeader 
          title="Atendimentos" 
          description="Chamados técnicos e atendimentos" 
          onAdd={() => { setEditing(null); setFormOpen(true); }} 
          addLabel="Novo Atendimento" 
          onExport={handleExport}
          onImport={() => setImportOpen(true)}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Listagem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <ServiceCallsDashboard />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <DataTable
              data={serviceCalls}
              columns={columns}
              loading={loading}
              searchPlaceholder="Buscar..."
              onEdit={(r) => { setEditing(r); setFormOpen(true); }}
              onDelete={setDeleting}
            />
          </TabsContent>
        </Tabs>

        <ServiceCallForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={(data) => {
            editing ? update({ id: editing.id, ...data }) : create(data as any);
            setFormOpen(false);
          }}
          initialData={editing}
          loading={isCreating || isUpdating}
        />
        <DeleteDialog
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          onConfirm={() => {
            if (deleting) {
              deleteRecord(deleting.id);
              setDeleting(null);
            }
          }}
          loading={isDeleting}
        />
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Atendimentos"
          description="Importe atendimentos a partir de uma planilha Excel"
          columnMappings={serviceCallImportConfig.mappings}
          templateColumns={serviceCallImportConfig.templateColumns}
          templateFilename="atendimentos"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
