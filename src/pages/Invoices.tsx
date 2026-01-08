import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { invoiceImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { useContracts } from '@/hooks/useContracts';

type Invoice = Tables<'invoices'> & { contracts?: { number: string; client_name: string } | null };

const columns: Column<Invoice>[] = [
  { key: 'number', label: 'Número' },
  { key: 'contracts.client_name', label: 'Cliente', render: (_, row) => row.contracts?.client_name || '-' },
  { key: 'issue_date', label: 'Emissão', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'due_date', label: 'Vencimento', render: (v) => v ? format(new Date(String(v)), 'dd/MM/yyyy') : '-' },
  { key: 'value', label: 'Valor Contrato', render: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
  { key: 'monthly_value', label: 'Valor do Mês', render: (v) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) : '-' },
  { key: 'discount', label: 'Desc./Acrés.', render: (v) => {
    const val = Number(v);
    if (val === 0) return '-';
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));
    return val > 0 ? `+${formatted}` : `-${formatted}`;
  }},
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v || 'pending')} /> },
];

export default function Invoices() {
  const { invoices, loading, create, update, delete: deleteRecord, isCreating, isUpdating, isDeleting } = useInvoices();
  const { contracts } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (format === 'pdf') exportToPDF(invoices, exportColumns, 'Faturamento');
    else if (format === 'excel') exportToExcel(invoices, exportColumns, 'Faturamento');
    else exportToCSV(invoices, exportColumns, 'Faturamento');
  };

  const handleImport = async (data: any[]) => {
    const firstContract = contracts[0];
    if (!firstContract) throw new Error('Cadastre um contrato primeiro');
    const dataWithContract = data.map(d => ({ ...d, contract_id: firstContract.id }));
    const { error } = await supabase.from('invoices').insert(dataWithContract);
    if (error) throw error;
  };

  return (
    <AppLayout title="Faturamento">
      <div className="space-y-6">
        <PageHeader 
          title="Faturamento" 
          description="Notas fiscais e pagamentos" 
          onAdd={() => { setEditing(null); setFormOpen(true); }} 
          addLabel="Nova Nota" 
          onExport={handleExport}
          onImport={() => setImportOpen(true)}
        />
        <DataTable data={invoices} columns={columns} loading={loading} searchPlaceholder="Buscar..." onEdit={(r) => { setEditing(r); setFormOpen(true); }} onDelete={setDeleting} />
        <InvoiceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={(data) => { editing ? update({ id: editing.id, ...data }) : create(data as any); setFormOpen(false); }} initialData={editing} loading={isCreating || isUpdating} />
        <DeleteDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={() => { if (deleting) { deleteRecord(deleting.id); setDeleting(null); } }} loading={isDeleting} />
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Notas Fiscais"
          description="Importe notas fiscais a partir de uma planilha Excel"
          columnMappings={invoiceImportConfig.mappings}
          templateColumns={invoiceImportConfig.templateColumns}
          templateFilename="faturamento"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
