import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { PhoneLineForm } from '@/components/phone-lines/PhoneLineForm';
import { PhoneLinesDashboard } from '@/components/phone-lines/PhoneLinesDashboard';
import { ChipNumbersTab } from '@/components/phone-lines/ChipNumbersTab';
import { usePhoneLines, type PhoneLine } from '@/hooks/usePhoneLines';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToExcel, exportToPDF } from '@/lib/export';
import { phoneLineImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';

const columns = [
  { 
    key: 'contracts', 
    label: 'Contrato',
    render: (value: PhoneLine['contracts']) => value ? `${value.number} - ${value.client_name}` : '-'
  },
  { 
    key: 'equipment', 
    label: 'Nº Equipamento',
    render: (value: PhoneLine['equipment']) => value?.serial_number || '-'
  },
  { key: 'line_number', label: 'Nº Linha' },
  { 
    key: 'carrier', 
    label: 'Operadora',
    render: (value: string) => <Badge variant="outline">{value}</Badge>
  },
  { 
    key: 'sub_carrier', 
    label: 'Sub Operadora',
    render: (value: string | null) => value ? <Badge variant="secondary">{value}</Badge> : '-'
  },
  { 
    key: 'status', 
    label: 'Status',
    render: (value: string) => (
      <Badge variant={value === 'active' ? 'default' : 'secondary'}>
        {value === 'active' ? 'Ativa' : 'Inativa'}
      </Badge>
    )
  },
];

export default function PhoneLines() {
  const { phoneLines, loading, createPhoneLine, updatePhoneLine, deletePhoneLine, isCreating, isUpdating, isDeleting } = usePhoneLines();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPhoneLine, setSelectedPhoneLine] = useState<PhoneLine | null>(null);

  const handleCreate = () => {
    setSelectedPhoneLine(null);
    setFormOpen(true);
  };

  const handleEdit = (phoneLine: PhoneLine) => {
    setSelectedPhoneLine(phoneLine);
    setFormOpen(true);
  };

  const handleDelete = (phoneLine: PhoneLine) => {
    setSelectedPhoneLine(phoneLine);
    setDeleteOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedPhoneLine) {
      updatePhoneLine({ id: selectedPhoneLine.id, ...data }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createPhoneLine(data, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedPhoneLine) {
      deletePhoneLine(selectedPhoneLine.id, {
        onSuccess: () => setDeleteOpen(false),
      });
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = [
      { key: 'Contrato', label: 'Contrato' },
      { key: 'Nº Equipamento', label: 'Nº Equipamento' },
      { key: 'Nº Linha', label: 'Nº Linha' },
      { key: 'Operadora', label: 'Operadora' },
      { key: 'Sub Operadora', label: 'Sub Operadora' },
      { key: 'Status', label: 'Status' },
    ];

    const exportData = phoneLines.map((pl) => ({
      Contrato: pl.contracts ? `${pl.contracts.number} - ${pl.contracts.client_name}` : '',
      'Nº Equipamento': pl.equipment?.serial_number || '',
      'Nº Linha': pl.line_number,
      Operadora: pl.carrier,
      'Sub Operadora': pl.sub_carrier || '',
      Status: pl.status === 'active' ? 'Ativa' : 'Inativa',
    }));

    if (format === 'excel' || format === 'csv') {
      exportToExcel(exportData, exportColumns, 'Linhas');
    } else {
      exportToPDF(exportData, exportColumns, 'Linhas / Chip');
    }
  };

  const handleImport = async (data: any[]) => {
    const dataWithIds = data.map(d => {
      // Resolve contract by number or client name
      const contract = contracts.find(c => 
        c.number?.toLowerCase() === d.contract_ref?.toLowerCase() ||
        c.client_name?.toLowerCase() === d.contract_ref?.toLowerCase()
      );
      
      if (!contract) {
        throw new Error(`Contrato não encontrado: ${d.contract_ref}`);
      }

      // Find equipment by serial within the contract
      const equipmentItem = equipment.find(e => 
        e.serial_number?.toLowerCase() === d.equipment_serial?.toLowerCase() &&
        e.contract_id === contract.id
      );
      
      if (!equipmentItem) {
        throw new Error(`Equipamento "${d.equipment_serial}" não encontrado no contrato "${d.contract_ref}"`);
      }

      const { contract_ref, equipment_serial, ...rest } = d;
      return { 
        ...rest, 
        contract_id: contract.id,
        equipment_id: equipmentItem.id,
      };
    });
    
    const { error } = await supabase.from('phone_lines').insert(dataWithIds);
    if (error) throw error;
    window.location.reload();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Linhas / Chip"
          description="Gerenciamento de linhas telefônicas dos equipamentos"
          onAdd={handleCreate}
          addLabel="Nova Linha / Equipamento"
          onExport={handleExport}
          onImport={() => setImportOpen(true)}
        />

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="chips">Cadastro de Chips</TabsTrigger>
            <TabsTrigger value="list">Linha / Equipamento</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <PhoneLinesDashboard phoneLines={phoneLines} />
          </TabsContent>

          <TabsContent value="chips">
            <ChipNumbersTab />
          </TabsContent>

          <TabsContent value="list">
            <DataTable
              data={phoneLines}
              columns={columns}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>

        <PhoneLineForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          phoneLine={selectedPhoneLine}
          isLoading={isCreating || isUpdating}
        />

        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
          title="Excluir Linha"
          description="Tem certeza que deseja excluir esta linha? Esta ação não pode ser desfeita."
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Linhas / Chip"
          description="Importe linhas a partir de uma planilha Excel"
          columnMappings={phoneLineImportConfig.mappings}
          templateColumns={phoneLineImportConfig.templateColumns}
          templateFilename="linhas-chip"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
