import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { TollTagForm } from '@/components/tolls/TollTagForm';
import { TollsDashboard } from '@/components/tolls/TollsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTollTags } from '@/hooks/useTollTags';
import { useVehicles } from '@/hooks/useVehicles';
import { useContracts } from '@/hooks/useContracts';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { tollImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Tolls() {
  const { tollTags, isLoading, deleteTollTag } = useTollTags();
  const { vehicles } = useVehicles();
  const { contracts } = useContracts();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('data');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.plate || '-';
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
      key: 'vehicle_id',
      label: 'Placa',
      render: (value: string) => getVehiclePlate(value),
    },
    {
      key: 'passage_date',
      label: 'Data/Hora',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    {
      key: 'value',
      label: 'Valor',
      render: (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    { key: 'tag_number', label: 'Nº TAG' },
    { key: 'toll_plaza', label: 'Estabelecimento', render: (v: string | null) => v || '-' },
  ];

  const handleEdit = (tag: any) => {
    setSelectedTag(tag);
    setFormOpen(true);
  };

  const handleDelete = (tag: any) => {
    setSelectedTag(tag);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTag) {
      deleteTollTag(selectedTag.id);
      setDeleteOpen(false);
      setSelectedTag(null);
    }
  };

  const exportColumns = [
    { key: 'Contrato', label: 'Contrato' },
    { key: 'Placa', label: 'Placa' },
    { key: 'Data/Hora', label: 'Data/Hora' },
    { key: 'Valor', label: 'Valor' },
    { key: 'Nº TAG', label: 'Nº TAG' },
    { key: 'Estabelecimento', label: 'Estabelecimento' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = tollTags.map((t) => ({
      Contrato: getContractName(t.contract_id),
      Placa: getVehiclePlate(t.vehicle_id),
      'Data/Hora': format(new Date(t.passage_date), 'dd/MM/yyyy HH:mm'),
      Valor: t.value,
      'Nº TAG': t.tag_number,
      Estabelecimento: t.toll_plaza || '',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'TAGs de Pedágio');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'tags');
    else exportToCSV(data, exportColumns, 'tags');
  };

  const handleImport = async (data: any[]) => {
    // Resolve contract_id by name and vehicle_id by plate
    const resolvedData = data.map((row, index) => {
      const rowNumber = index + 2;
      
      // Resolve vehicle by plate (required)
      const vehiclePlate = String(row.vehicle_id || '').trim().toUpperCase();
      const vehicle = vehicles.find((v) => v.plate?.toUpperCase() === vehiclePlate);
      if (!vehicle) {
        throw new Error(`Linha ${rowNumber}: Veículo com placa "${vehiclePlate}" não encontrado`);
      }
      
      // Resolve contract by name (optional)
      let contractId: string | null = null;
      if (row.contract_id) {
        const contractName = String(row.contract_id).trim().toLowerCase();
        const contract = contracts.find(
          (c) =>
            c.client_name?.toLowerCase() === contractName ||
            c.number?.toLowerCase() === contractName ||
            `${c.number} - ${c.client_name}`.toLowerCase() === contractName
        );
        if (contract) {
          contractId = contract.id;
        }
      }
      
      return {
        vehicle_id: vehicle.id,
        contract_id: contractId,
        passage_date: row.passage_date,
        value: row.value,
        tag_number: row.tag_number,
        toll_plaza: row.toll_plaza,
      };
    });

    const { error } = await supabase.from('toll_tags').insert(resolvedData);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['toll_tags'] });
    toast.success(`${resolvedData.length} registros importados com sucesso!`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">TAG</h1>
          <p className="text-muted-foreground">Gerencie as informações de TAG dos veículos</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="data" className="flex-1 max-w-xs">Dados</TabsTrigger>
            <TabsTrigger value="dashboard" className="flex-1 max-w-xs">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4">
            <PageHeader
              title="TAGs"
              onAdd={() => {
                setSelectedTag(null);
                setFormOpen(true);
              }}
              onExport={handleExport}
              onImport={() => setImportOpen(true)}
            />

            <DataTable
              data={tollTags}
              columns={columns}
              loading={isLoading}
              searchPlaceholder="Buscar TAGs..."
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="dashboard">
            <TollsDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <TollTagForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tag={selectedTag}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir TAG"
        description="Tem certeza que deseja excluir esta TAG?"
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        title="Importar TAGs de Pedágio"
        columnMappings={tollImportConfig.mappings}
        templateColumns={tollImportConfig.templateColumns}
        templateFilename="template_tags"
      />
    </AppLayout>
  );
}
