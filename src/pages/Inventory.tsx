import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useInventory } from '@/hooks/useInventory';
import { InventoryForm } from '@/components/inventory/InventoryForm';
import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { inventoryImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';

type Inventory = Tables<'inventory'>;

const columns: Column<Inventory>[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'component_name', label: 'Componente' },
  { key: 'category', label: 'Categoria' },
  { key: 'quantity', label: 'Quantidade', render: (v, row) => {
    const qty = Number(v) || 0;
    const min = row.min_quantity || 0;
    const variant = qty <= min ? 'destructive' : qty <= min * 1.5 ? 'outline' : 'default';
    return <Badge variant={variant}>{qty}</Badge>;
  }},
  { key: 'min_quantity', label: 'Mínimo' },
  { key: 'unit_price', label: 'Preço Unit.', render: (v) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) : '-' },
  { key: 'location', label: 'Localização' },
];

export default function InventoryPage() {
  const { items, loading, create, update, delete: deleteRecord, isCreating, isUpdating, isDeleting } = useInventory();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Inventory | null>(null);
  const [deleting, setDeleting] = useState<Inventory | null>(null);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (format === 'pdf') exportToPDF(items, exportColumns, 'Estoque');
    else if (format === 'excel') exportToExcel(items, exportColumns, 'Estoque');
    else exportToCSV(items, exportColumns, 'Estoque');
  };

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('inventory').insert(data);
    if (error) throw error;
  };

  return (
    <AppLayout title="Estoque">
      <div className="space-y-6">
        <PageHeader 
          title="Estoque" 
          description="Controle de componentes e materiais" 
          onAdd={() => { setEditing(null); setFormOpen(true); }} 
          addLabel="Novo Item" 
          onExport={handleExport}
          onImport={() => setImportOpen(true)}
        />
        <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Buscar..." onEdit={(r) => { setEditing(r); setFormOpen(true); }} onDelete={setDeleting} />
        <InventoryForm open={formOpen} onOpenChange={setFormOpen} onSubmit={(data) => { editing ? update({ id: editing.id, ...data }) : create(data as any); setFormOpen(false); }} initialData={editing} loading={isCreating || isUpdating} />
        <DeleteDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={() => { if (deleting) { deleteRecord(deleting.id); setDeleting(null); } }} loading={isDeleting} />
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Estoque"
          description="Importe itens de estoque a partir de uma planilha Excel"
          columnMappings={inventoryImportConfig.mappings}
          templateColumns={inventoryImportConfig.templateColumns}
          templateFilename="estoque"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
