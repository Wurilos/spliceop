import { useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { ChipNumberForm } from './ChipNumberForm';
import { useChipNumbers, type ChipNumber } from '@/hooks/useChipNumbers';
import { usePhoneLines } from '@/hooks/usePhoneLines';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { chipNumberImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const columns = [
  { key: 'line_number', label: 'Número da Linha' },
  { 
    key: 'carrier', 
    label: 'Operadora',
    render: (value: string) => <Badge variant="outline">{value}</Badge>
  },
];

export function ChipNumbersTab() {
  const { chipNumbers, loading, createChipNumber, updateChipNumber, deleteChipNumber, deleteMany: deleteManyChips, isCreating, isUpdating, isDeleting } = useChipNumbers();
  const { phoneLines } = usePhoneLines();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<ChipNumber | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = () => {
    setSelectedChip(null);
    setFormOpen(true);
  };

  const handleEdit = (chip: ChipNumber) => {
    setSelectedChip(chip);
    setFormOpen(true);
  };

  const handleDelete = (chip: ChipNumber) => {
    setSelectedChip(chip);
    setDeleteOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedChip) {
      updateChipNumber({ id: selectedChip.id, ...data }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createChipNumber(data, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedChip) {
      deleteChipNumber(selectedChip.id, {
        onSuccess: () => setDeleteOpen(false),
      });
    }
  };

  const handleImport = async (data: any[]) => {
    // Validate carriers
    const validCarriers = ['Vivo', 'Oi', 'TIM', 'Claro', 'DATATEM'];
    const invalidRows = data.filter(d => !validCarriers.includes(d.carrier));
    
    if (invalidRows.length > 0) {
      throw new Error(`Operadoras inválidas encontradas. Use: ${validCarriers.join(', ')}`);
    }

    // Check for duplicates within import data
    const lineNumbers = data.map(d => d.line_number);
    const duplicates = lineNumbers.filter((item, index) => lineNumbers.indexOf(item) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Números de linha duplicados na planilha: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check for existing line numbers
    const existingLines = chipNumbers.map(c => c.line_number.toLowerCase());
    const conflicts = data.filter(d => existingLines.includes(d.line_number.toLowerCase()));
    if (conflicts.length > 0) {
      throw new Error(`Números de linha já cadastrados: ${conflicts.map(c => c.line_number).join(', ')}`);
    }

    const { error } = await supabase.from('chip_numbers').insert(data);
    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['chip_numbers'] });
    toast({ title: `${data.length} chip(s) importado(s) com sucesso!` });
  };

  // Add status column showing if chip is linked
  const columnsWithStatus = [
    ...columns,
    {
      key: 'id',
      label: 'Status',
      render: (value: string) => {
        const linkedPhoneLine = phoneLines.find(pl => pl.chip_id === value);
        if (linkedPhoneLine) {
          return (
            <Badge variant="secondary">
              Vinculado: {linkedPhoneLine.equipment?.serial_number || 'Equipamento'}
            </Badge>
          );
        }
        return <Badge variant="outline" className="text-muted-foreground">Disponível</Badge>;
      }
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Cadastro de Chips</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre os números dos chips que poderão ser vinculados aos equipamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Chip
          </Button>
        </div>
      </div>

      <DataTable
        data={chipNumbers}
        columns={columnsWithStatus}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeleteMany={deleteManyChips}
      />

      <ChipNumberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        chipNumber={selectedChip}
        isLoading={isCreating || isUpdating}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Excluir Chip"
        description="Tem certeza que deseja excluir este chip? Esta ação não pode ser desfeita."
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar Chips"
        description="Importe números de chips a partir de uma planilha Excel"
        columnMappings={chipNumberImportConfig.mappings}
        templateColumns={chipNumberImportConfig.templateColumns}
        templateFilename="chips"
        onImport={handleImport}
      />
    </div>
  );
}
