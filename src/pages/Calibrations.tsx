import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useCalibrations } from '@/hooks/useCalibrations';
import { CalibrationForm } from '@/components/calibrations/CalibrationForm';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { calibrationImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { useEquipment } from '@/hooks/useEquipment';

type Calibration = Tables<'calibrations'> & { equipment?: { serial_number: string; type: string | null; brand: string | null } | null };

const columns: Column<Calibration>[] = [
  { key: 'equipment.serial_number', label: 'Equipamento', render: (_, row) => row.equipment?.serial_number || '-' },
  { key: 'equipment.type', label: 'Tipo', render: (_, row) => row.equipment?.type || '-' },
  { key: 'calibration_date', label: 'Data Aferição', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'expiration_date', label: 'Validade', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'certificate_number', label: 'Certificado' },
  { key: 'inmetro_number', label: 'Nº INMETRO' },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v || 'valid')} /> },
];

export default function Calibrations() {
  const { calibrations, loading, create, update, delete: deleteRecord, isCreating, isUpdating, isDeleting } = useCalibrations();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Calibration | null>(null);
  const [deleting, setDeleting] = useState<Calibration | null>(null);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (format === 'pdf') exportToPDF(calibrations, exportColumns, 'Aferições');
    else if (format === 'excel') exportToExcel(calibrations, exportColumns, 'Aferições');
    else exportToCSV(calibrations, exportColumns, 'Aferições');
  };

  const handleImport = async (data: any[]) => {
    const firstEquipment = equipment[0];
    if (!firstEquipment) throw new Error('Cadastre um equipamento primeiro');
    const dataWithEquipment = data.map(d => ({ ...d, equipment_id: firstEquipment.id }));
    const { error } = await supabase.from('calibrations').insert(dataWithEquipment);
    if (error) throw error;
  };

  return (
    <AppLayout title="Aferições">
      <div className="space-y-6">
        <PageHeader 
          title="Aferições" 
          description="Calibrações INMETRO de equipamentos" 
          onAdd={() => { setEditing(null); setFormOpen(true); }} 
          addLabel="Nova Aferição" 
          onExport={handleExport}
          onImport={() => setImportOpen(true)}
        />
        <DataTable data={calibrations} columns={columns} loading={loading} searchPlaceholder="Buscar..." onEdit={(r) => { setEditing(r); setFormOpen(true); }} onDelete={setDeleting} />
        <CalibrationForm open={formOpen} onOpenChange={setFormOpen} onSubmit={(data) => { editing ? update({ id: editing.id, ...data }) : create(data as any); setFormOpen(false); }} initialData={editing} loading={isCreating || isUpdating} />
        <DeleteDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={() => { if (deleting) { deleteRecord(deleting.id); setDeleting(null); } }} loading={isDeleting} />
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Aferições"
          description="Importe aferições a partir de uma planilha Excel"
          columnMappings={calibrationImportConfig.mappings}
          templateColumns={calibrationImportConfig.templateColumns}
          templateFilename="afericoes"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
