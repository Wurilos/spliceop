import { useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ChipNumberForm } from './ChipNumberForm';
import { useChipNumbers, type ChipNumber } from '@/hooks/useChipNumbers';
import { usePhoneLines } from '@/hooks/usePhoneLines';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'line_number', label: 'Número da Linha' },
  { 
    key: 'carrier', 
    label: 'Operadora',
    render: (value: string) => <Badge variant="outline">{value}</Badge>
  },
];

export function ChipNumbersTab() {
  const { chipNumbers, loading, createChipNumber, updateChipNumber, deleteChipNumber, isCreating, isUpdating, isDeleting } = useChipNumbers();
  const { phoneLines } = usePhoneLines();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<ChipNumber | null>(null);

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
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Chip
        </Button>
      </div>

      <DataTable
        data={chipNumbers}
        columns={columnsWithStatus}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
    </div>
  );
}
