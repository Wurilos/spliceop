import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { useVehicles } from '@/hooks/useVehicles';
import { VehicleForm } from '@/components/vehicles/VehicleForm';
import { Tables } from '@/integrations/supabase/types';

type Vehicle = Tables<'vehicles'> & { contracts?: { number: string; client_name: string } | null };

const columns: Column<Vehicle>[] = [
  { key: 'plate', label: 'Placa' },
  { key: 'brand', label: 'Marca' },
  { key: 'model', label: 'Modelo' },
  { key: 'year', label: 'Ano' },
  { key: 'color', label: 'Cor' },
  { key: 'fuel_card', label: 'Cartão Comb.' },
  {
    key: 'contracts.client_name',
    label: 'Contrato',
    render: (_, row) => row.contracts?.client_name || '-',
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={String(value || 'active')} />,
  },
];

export default function Vehicles() {
  const { vehicles, loading, create, update, delete: deleteVehicle, isCreating, isUpdating, isDeleting } = useVehicles();
  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setDeletingVehicle(vehicle);
  };

  const handleFormSubmit = (data: Partial<Vehicle>) => {
    if (editingVehicle) {
      update({ id: editingVehicle.id, ...data });
    } else {
      create(data as any);
    }
    setFormOpen(false);
    setEditingVehicle(null);
  };

  const handleConfirmDelete = () => {
    if (deletingVehicle) {
      deleteVehicle(deletingVehicle.id);
      setDeletingVehicle(null);
    }
  };

  return (
    <AppLayout title="Veículos">
      <div className="space-y-6">
        <PageHeader
          title="Veículos"
          description="Gerencie a frota operacional"
          onAdd={handleAdd}
          addLabel="Novo Veículo"
        />

        <DataTable
          data={vehicles}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar veículos..."
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <VehicleForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingVehicle}
          loading={isCreating || isUpdating}
        />

        <DeleteDialog
          open={!!deletingVehicle}
          onOpenChange={(open) => !open && setDeletingVehicle(null)}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
