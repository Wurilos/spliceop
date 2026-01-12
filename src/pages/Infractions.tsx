import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { InfractionForm } from '@/components/infractions/InfractionForm';
import { InfractionsDashboard } from '@/components/infractions/InfractionsDashboard';
import { useInfractions } from '@/hooks/useInfractions';
import { useEquipment } from '@/hooks/useEquipment';
import { useContracts } from '@/hooks/useContracts';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { infractionImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, List } from 'lucide-react';

export default function Infractions() {
  const { infractions, isLoading, deleteInfraction } = useInfractions();
  const { equipment } = useEquipment();
  const { contracts } = useContracts();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedInfraction, setSelectedInfraction] = useState<any>(null);

  const getEquipmentSerial = (equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId);
    return eq?.serial_number || '-';
  };

  const getContractName = (contractId: string | null) => {
    if (!contractId) return '-';
    const contract = contracts.find((c) => c.id === contractId);
    return contract ? `${contract.number} - ${contract.client_name}` : '-';
  };

  const columns = [
    {
      key: 'contract_id',
      label: 'Contrato',
      render: (value: string | null) => getContractName(value),
    },
    {
      key: 'equipment_id',
      label: 'Equipamento',
      render: (value: string) => getEquipmentSerial(value),
    },
    { key: 'month', label: 'Mês' },
    { key: 'year', label: 'Ano' },
    { key: 'datacheck_lane', label: 'Faixa Datacheck' },
    { key: 'physical_lane', label: 'Faixa Física' },
    {
      key: 'image_count',
      label: 'Qtd Imagens',
      render: (value: number | null) => value?.toLocaleString('pt-BR') || '0',
    },
  ];

  const handleEdit = (infraction: any) => {
    setSelectedInfraction(infraction);
    setFormOpen(true);
  };

  const handleDelete = (infraction: any) => {
    setSelectedInfraction(infraction);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInfraction) {
      deleteInfraction(selectedInfraction.id);
      setDeleteOpen(false);
      setSelectedInfraction(null);
    }
  };

  const exportColumns = [
    { key: 'Contrato', label: 'Contrato' },
    { key: 'Equipamento', label: 'Equipamento' },
    { key: 'Mês', label: 'Mês' },
    { key: 'Ano', label: 'Ano' },
    { key: 'Faixa Datacheck', label: 'Faixa Datacheck' },
    { key: 'Faixa Física', label: 'Faixa Física' },
    { key: 'Qtd Imagens', label: 'Qtd Imagens' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = infractions.map((i) => ({
      'Contrato': getContractName(i.contract_id),
      'Equipamento': getEquipmentSerial(i.equipment_id),
      'Mês': i.month || '',
      'Ano': i.year || '',
      'Faixa Datacheck': i.datacheck_lane || '',
      'Faixa Física': i.physical_lane || '',
      'Qtd Imagens': i.image_count || 0,
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Infrações');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'infracoes');
    else exportToCSV(data, exportColumns, 'infracoes');
  };

  const handleImport = async (data: any[]) => {
    // Resolve contract and equipment references
    const resolvedData = data.map((row) => {
      let contractId = row.contract_id;
      let equipmentId = row.equipment_id;

      // Resolve contract by number or client_name
      if (contractId && typeof contractId === 'string') {
        const contract = contracts.find(
          (c) => c.number === contractId || c.client_name?.toLowerCase() === contractId.toLowerCase()
        );
        contractId = contract?.id || null;
      }

      // Resolve equipment by serial_number
      if (equipmentId && typeof equipmentId === 'string') {
        const eq = equipment.find((e) => e.serial_number === equipmentId);
        equipmentId = eq?.id || null;
      }

      if (!equipmentId) {
        throw new Error(`Equipamento não encontrado: ${row.equipment_id}`);
      }

      return {
        ...row,
        contract_id: contractId || null,
        equipment_id: equipmentId,
      };
    });

    const { error } = await supabase.from('infractions').insert(resolvedData);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['infractions'] });
    toast.success(`${resolvedData.length} registros importados com sucesso!`);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Infrações"
        description="Registro de infrações detectadas"
        onAdd={() => {
          setSelectedInfraction(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
        onImport={() => setImportOpen(true)}
      />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Listagem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <InfractionsDashboard />
        </TabsContent>

        <TabsContent value="list">
          <DataTable
            data={infractions}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Buscar por equipamento..."
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      <InfractionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        infraction={selectedInfraction}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Infração"
        description="Tem certeza que deseja excluir esta infração?"
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        title="Importar Infrações"
        columnMappings={infractionImportConfig.mappings}
        templateColumns={infractionImportConfig.templateColumns}
        templateFilename="template_infracoes"
      />
    </AppLayout>
  );
}
