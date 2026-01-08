import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useEquipment } from '@/hooks/useEquipment';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { equipmentImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

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

const exportColumns = [
  { key: 'Nº Série', label: 'Nº Série' },
  { key: 'Tipo', label: 'Tipo' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Modelo', label: 'Modelo' },
  { key: 'Localização', label: 'Localização' },
  { key: 'Status', label: 'Status' },
];

export default function EquipmentPage() {
  const { equipment, loading, create, update, delete: deleteEquipment, isCreating, isUpdating, isDeleting } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('equipment').insert(data);
    if (error) throw error;
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = equipment.map((e) => ({
      'Nº Série': e.serial_number,
      'Tipo': e.type || '',
      'Marca': e.brand || '',
      'Modelo': e.model || '',
      'Localização': e.address || '',
      'Status': e.status || '',
    }));
    if (type === 'pdf') exportToPDF(data, exportColumns, 'Equipamentos');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'equipamentos');
    else exportToCSV(data, exportColumns, 'equipamentos');
  };

  return (
    <AppLayout title="Equipamentos">
      <div className="space-y-6">
        <PageHeader
          title="Equipamentos"
          description="Gerencie radares e medidores de velocidade"
          onAdd={handleAdd}
          addLabel="Novo Equipamento"
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
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
          tableName="equipment"
          recordId={deletingEquipment?.id}
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Equipamentos"
          description="Importe equipamentos a partir de uma planilha Excel"
          columnMappings={equipmentImportConfig.mappings}
          templateColumns={equipmentImportConfig.templateColumns}
          templateFilename="equipamentos"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
