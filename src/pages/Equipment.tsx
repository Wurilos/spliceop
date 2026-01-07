import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { useEquipment } from '@/hooks/useEquipment';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type Equipment = Tables<'equipment'> & { contracts?: { number: string; client_name: string } | null };

const columns: Column<Equipment>[] = [
  { key: 'serial_number', label: 'Nº Série' },
  { key: 'type', label: 'Tipo' },
  { key: 'brand', label: 'Marca' },
  { key: 'model', label: 'Modelo' },
  { key: 'address', label: 'Localização' },
  {
    key: 'contracts.client_name',
    label: 'Contrato',
    render: (_, row) => row.contracts?.client_name || '-',
  },
  {
    key: 'next_calibration_date',
    label: 'Próx. Aferição',
    render: (value) => (value ? format(new Date(String(value)), 'dd/MM/yyyy') : '-'),
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={String(value || 'active')} />,
  },
];

export default function EquipmentPage() {
  const { equipment, loading, create, update, delete: deleteEquipment, isCreating, isUpdating, isDeleting } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);

  const handleAdd = () => {
    setEditingEquipment(null);
    setFormOpen(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormOpen(true);
  };

  const handleDelete = (eq: Equipment) => {
    setDeletingEquipment(eq);
  };

  const handleFormSubmit = (data: Partial<Equipment>) => {
    if (editingEquipment) {
      update({ id: editingEquipment.id, ...data });
    } else {
      create(data as any);
    }
    setFormOpen(false);
    setEditingEquipment(null);
  };

  const handleConfirmDelete = () => {
    if (deletingEquipment) {
      deleteEquipment(deletingEquipment.id);
      setDeletingEquipment(null);
    }
  };

  return (
    <AppLayout title="Equipamentos">
      <div className="space-y-6">
        <PageHeader
          title="Equipamentos"
          description="Gerencie radares e medidores de velocidade"
          onAdd={handleAdd}
          addLabel="Novo Equipamento"
        />

        <DataTable
          data={equipment}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar equipamentos..."
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <EquipmentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingEquipment}
          loading={isCreating || isUpdating}
        />

        <DeleteDialog
          open={!!deletingEquipment}
          onOpenChange={(open) => !open && setDeletingEquipment(null)}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
