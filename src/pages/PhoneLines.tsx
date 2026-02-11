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
  const { phoneLines, loading, createPhoneLine, updatePhoneLine, deletePhoneLine, deleteMany: deleteManyPhoneLines, isCreating, isUpdating, isDeleting } = usePhoneLines();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPhoneLine, setSelectedPhoneLine] = useState<PhoneLine | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

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
    // Normalizações / validações básicas
    const carrierMap: Record<string, string> = {
      vivo: 'Vivo',
      oi: 'Oi',
      tim: 'TIM',
      claro: 'Claro',
      datatem: 'DATATEM',
    };
    const subCarrierMap: Record<string, string> = {
      vivo: 'Vivo',
      oi: 'Oi',
      tim: 'TIM',
      claro: 'Claro',
    };

    const rows = data.map((d) => {
      const carrier = carrierMap[String(d.carrier ?? '').trim().toLowerCase()] || String(d.carrier ?? '').trim();
      const subCarrierRaw = String(d.sub_carrier ?? '').trim();
      const sub_carrier = subCarrierRaw
        ? (subCarrierMap[subCarrierRaw.toLowerCase()] || subCarrierRaw)
        : null;

      return {
        contract_ref: String(d.contract_ref ?? '').trim(),
        equipment_serial: String(d.equipment_serial ?? '').trim(),
        line_number: String(d.line_number ?? '').trim(),
        carrier,
        sub_carrier,
        status: d.status ? String(d.status).trim() : null,
      };
    });

    // Duplicados na planilha
    const lineNumbersLower = rows.map((r) => r.line_number.toLowerCase());
    const duplicated = lineNumbersLower.filter((v, i) => lineNumbersLower.indexOf(v) !== i);
    if (duplicated.length > 0) {
      throw new Error(`Números de linha duplicados na planilha: ${[...new Set(duplicated)].join(', ')}`);
    }

    // Resolver contrato/equipamento + validar conciliação e preparar criação de chips
    const prepared = rows.map((r) => {
      const contract = contracts.find(
        (c) =>
          c.number?.toLowerCase() === r.contract_ref.toLowerCase() ||
          c.client_name?.toLowerCase() === r.contract_ref.toLowerCase()
      );
      if (!contract) throw new Error(`Contrato não encontrado: ${r.contract_ref}`);

      const equipmentItem = equipment.find(
        (e) => e.serial_number?.toLowerCase() === r.equipment_serial.toLowerCase() && e.contract_id === contract.id
      );
      if (!equipmentItem) {
        throw new Error(`Equipamento "${r.equipment_serial}" não encontrado no contrato "${r.contract_ref}"`);
      }

      // Se DATATEM, sub operadora é obrigatória
      if (r.carrier === 'DATATEM') {
        if (!r.sub_carrier) {
          throw new Error(`Linha ${r.line_number}: para operadora DATATEM informe "Sub Operadora" (Vivo/Oi/TIM/Claro)`);
        }
        const allowed = ['Vivo', 'Oi', 'TIM', 'Claro'];
        if (!allowed.includes(r.sub_carrier)) {
          throw new Error(`Linha ${r.line_number}: Sub Operadora inválida. Use: ${allowed.join(', ')}`);
        }
      }

      // Conciliação: não permitir mesma linha em equipamentos diferentes
      const existing = phoneLines.find((pl) => pl.line_number?.toLowerCase() === r.line_number.toLowerCase());
      if (existing && existing.equipment_id !== equipmentItem.id) {
        const eq = existing.equipment?.serial_number || 'equipamento';
        throw new Error(`Linha já vinculada a outro equipamento (${eq})`);
      }

      return { ...r, contract_id: contract.id, equipment_id: equipmentItem.id };
    });

    // 1) Garantir chips cadastrados
    const uniqueLineNumbers = [...new Set(prepared.map((r) => r.line_number))];
    const { data: existingChips, error: chipsFetchError } = await supabase
      .from('chip_numbers')
      .select('id, line_number, carrier')
      .in('line_number', uniqueLineNumbers);
    if (chipsFetchError) throw chipsFetchError;

    const chipByLine = new Map<string, { id: string; line_number: string; carrier: string }>();
    (existingChips || []).forEach((c) => chipByLine.set(c.line_number.toLowerCase(), c));

    // Se já existe chip com a mesma linha, mas operadora diferente, bloquear
    for (const r of prepared) {
      const existingChip = chipByLine.get(r.line_number.toLowerCase());
      if (existingChip && existingChip.carrier !== r.carrier) {
        throw new Error(
          `Linha ${r.line_number}: já cadastrada com operadora "${existingChip.carrier}" (na planilha: "${r.carrier}")`
        );
      }
    }

    const missingChips = prepared
      .filter((r) => !chipByLine.has(r.line_number.toLowerCase()))
      .map((r) => ({ line_number: r.line_number, carrier: r.carrier }));

    if (missingChips.length > 0) {
      const { error: chipsInsertError } = await supabase.from('chip_numbers').insert(missingChips);
      if (chipsInsertError) throw chipsInsertError;
    }

    // Recarrega chips para obter IDs
    const { data: allChips, error: chipsFetch2Error } = await supabase
      .from('chip_numbers')
      .select('id, line_number, carrier')
      .in('line_number', uniqueLineNumbers);
    if (chipsFetch2Error) throw chipsFetch2Error;

    const chipByLine2 = new Map<string, { id: string; line_number: string; carrier: string }>();
    (allChips || []).forEach((c) => chipByLine2.set(c.line_number.toLowerCase(), c));

    // 2) Criar vínculos linha/equipamento
    const inserts = prepared.map((r) => {
      const chip = chipByLine2.get(r.line_number.toLowerCase());
      if (!chip) throw new Error(`Falha ao localizar chip para a linha ${r.line_number}`);

      // Conciliação por chip_id também
      const existingByChip = phoneLines.find((pl) => pl.chip_id === chip.id);
      if (existingByChip && existingByChip.equipment_id !== r.equipment_id) {
        const eq = existingByChip.equipment?.serial_number || 'equipamento';
        throw new Error(`Linha já vinculada a outro equipamento (${eq})`);
      }

      return {
        contract_id: r.contract_id,
        equipment_id: r.equipment_id,
        chip_id: chip.id,
        line_number: chip.line_number,
        carrier: chip.carrier,
        sub_carrier: r.carrier === 'DATATEM' ? r.sub_carrier : null,
        status: r.status === 'inactive' ? 'inactive' : 'active',
      };
    });

    const { error } = await supabase.from('phone_lines').insert(inserts);
    if (error) throw error;

    window.location.reload();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Linhas / Chip"
          description="Gerenciamento de linhas telefônicas dos equipamentos"
          onAdd={activeTab === 'list' ? handleCreate : undefined}
          addLabel="Nova Linha / Equipamento"
          onExport={activeTab === 'list' ? handleExport : undefined}
          onImport={activeTab === 'list' ? () => setImportOpen(true) : undefined}
        />

        <Tabs defaultValue="dashboard" className="space-y-4" onValueChange={setActiveTab}>
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
              onDeleteMany={deleteManyPhoneLines}
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
