import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { PhoneLineForm } from '@/components/phone-lines/PhoneLineForm';
import { usePhoneLines, type PhoneLine } from '@/hooks/usePhoneLines';
import { Badge } from '@/components/ui/badge';
import { exportToExcel, exportToPDF } from '@/lib/export';

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
  const [formOpen, setFormOpen] = useState(false);
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Linhas / Chip"
          description="Gerenciamento de linhas telefônicas dos equipamentos"
          onAdd={handleCreate}
          addLabel="Nova Linha"
          onExport={handleExport}
        />

        <DataTable
          data={phoneLines}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

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
      </div>
    </AppLayout>
  );
}
