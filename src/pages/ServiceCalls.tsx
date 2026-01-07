import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { useServiceCalls } from '@/hooks/useServiceCalls';
import { ServiceCallForm } from '@/components/service-calls/ServiceCallForm';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

type ServiceCall = Tables<'service_calls'> & { 
  contracts?: { number: string; client_name: string } | null;
  equipment?: { serial_number: string } | null;
  employees?: { full_name: string } | null;
};

const columns: Column<ServiceCall>[] = [
  { key: 'date', label: 'Data', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'type', label: 'Tipo' },
  { key: 'contracts.client_name', label: 'Contrato', render: (_, row) => row.contracts?.client_name || '-' },
  { key: 'equipment.serial_number', label: 'Equipamento', render: (_, row) => row.equipment?.serial_number || '-' },
  { key: 'employees.full_name', label: 'Técnico', render: (_, row) => row.employees?.full_name || '-' },
  { key: 'description', label: 'Descrição', render: (v) => String(v || '-').substring(0, 30) + (String(v || '').length > 30 ? '...' : '') },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v || 'open')} /> },
];

export default function ServiceCalls() {
  const { serviceCalls, loading, create, update, delete: deleteRecord, isCreating, isUpdating, isDeleting } = useServiceCalls();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCall | null>(null);
  const [deleting, setDeleting] = useState<ServiceCall | null>(null);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (format === 'pdf') exportToPDF(serviceCalls, exportColumns, 'Atendimentos');
    else if (format === 'excel') exportToExcel(serviceCalls, exportColumns, 'Atendimentos');
    else exportToCSV(serviceCalls, exportColumns, 'Atendimentos');
  };

  return (
    <AppLayout title="Atendimentos">
      <div className="space-y-6">
        <PageHeader title="Atendimentos" description="Chamados técnicos e atendimentos" onAdd={() => { setEditing(null); setFormOpen(true); }} addLabel="Novo Atendimento" onExport={handleExport} />
        <DataTable data={serviceCalls} columns={columns} loading={loading} searchPlaceholder="Buscar..." onEdit={(r) => { setEditing(r); setFormOpen(true); }} onDelete={setDeleting} />
        <ServiceCallForm open={formOpen} onOpenChange={setFormOpen} onSubmit={(data) => { editing ? update({ id: editing.id, ...data }) : create(data as any); setFormOpen(false); }} initialData={editing} loading={isCreating || isUpdating} />
        <DeleteDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={() => { if (deleting) { deleteRecord(deleting.id); setDeleting(null); } }} loading={isDeleting} />
      </div>
    </AppLayout>
  );
}
