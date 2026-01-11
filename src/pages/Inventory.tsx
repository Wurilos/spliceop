import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable, Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp, Package, BarChart3, Wrench, Upload } from 'lucide-react';
import { useComponents, Component } from '@/hooks/useComponents';
import { useStock, Stock } from '@/hooks/useStock';
import { useStockMaintenance, StockMaintenance } from '@/hooks/useStockMaintenance';
import { ComponentForm } from '@/components/inventory/ComponentForm';
import { StockForm } from '@/components/inventory/StockForm';
import { MaintenanceForm } from '@/components/inventory/MaintenanceForm';
import { InventoryDashboard } from '@/components/inventory/InventoryDashboard';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { componentImportConfig } from '@/lib/importConfigs';
import { useToast } from '@/hooks/use-toast';

const componentColumns: Column<Component>[] = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Descrição' },
  { key: 'type', label: 'Tipo' },
  { key: 'value', label: 'Valor', render: (v) => v ? `R$ ${(v as number).toFixed(2)}` : '-' },
];

const stockColumns: Column<Stock>[] = [
  { key: 'contracts', label: 'Contrato', render: (_, row) => row.contracts ? `${row.contracts.number} - ${row.contracts.client_name}` : '-' },
  { key: 'components', label: 'Componente', render: (_, row) => row.components?.name || '-' },
  { key: 'quantity', label: 'Quantidade', render: (v) => <Badge variant="default">{v as number}</Badge> },
];

const maintenanceColumns: Column<StockMaintenance>[] = [
  { key: 'contracts', label: 'Contrato', render: (_, row) => row.contracts ? `${row.contracts.number}` : '-' },
  { key: 'om_number', label: 'Nº O.M' },
  { key: 'nf_number', label: 'Nº NF' },
  { key: 'send_date', label: 'Data Envio', render: (v) => v ? format(new Date(v as string), 'dd/MM/yyyy') : '-' },
  { key: 'return_date', label: 'Data Retorno', render: (v) => v ? format(new Date(v as string), 'dd/MM/yyyy') : '-' },
  { key: 'status', label: 'Status', render: (v) => (
    <Badge variant={v === 'em_manutencao' ? 'destructive' : 'default'}>
      {v === 'em_manutencao' ? 'Em Manutenção' : 'Retornado'}
    </Badge>
  )},
  { key: 'stock_maintenance_items', label: 'Componentes', render: (_, row) => row.stock_maintenance_items?.length || 0 },
];

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    components,
    loading: loadingComponents,
    create: createComponent,
    update: updateComponent,
    delete: deleteComponent,
    isCreating: isCreatingComponent,
    isUpdating: isUpdatingComponent,
    isDeleting: isDeletingComponent,
  } = useComponents();

  const {
    items: stockItems,
    loading: loadingStock,
    create: createStock,
    update: updateStock,
    delete: deleteStock,
    isCreating: isCreatingStock,
    isUpdating: isUpdatingStock,
    isDeleting: isDeletingStock,
  } = useStock();

  const {
    items: maintenanceItems,
    loading: loadingMaintenance,
    create: createMaintenance,
    update: updateMaintenance,
    delete: deleteMaintenance,
    isCreating: isCreatingMaintenance,
    isUpdating: isUpdatingMaintenance,
    isDeleting: isDeletingMaintenance,
  } = useStockMaintenance();

  const [componentFormOpen, setComponentFormOpen] = useState(false);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  const [componentImportOpen, setComponentImportOpen] = useState(false);

  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<StockMaintenance | null>(null);

  const [deletingComponent, setDeletingComponent] = useState<Component | null>(null);
  const [deletingStock, setDeletingStock] = useState<Stock | null>(null);
  const [deletingMaintenance, setDeletingMaintenance] = useState<StockMaintenance | null>(null);

  const handleComponentImport = async (records: Record<string, any>[]) => {
    const validRecords = records.map(r => ({
      code: r.code || null,
      name: r.name,
      type: r.type || null,
      value: r.value || null,
    }));
    const { error } = await supabase.from('components').insert(validRecords);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['components'] });
    toast({ title: 'Componentes importados com sucesso!' });
  };

  return (
    <AppLayout title="Estoque e Manutenções">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Estoque e Manutenções</h1>
            <p className="text-muted-foreground">Gerenciamento de componentes, estoque e controle de manutenções</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Componentes
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Estoque
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Manutenção
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <InventoryDashboard />
          </TabsContent>

          <TabsContent value="components">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cadastro de Componentes</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setComponentImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" /> Importar
                  </Button>
                  <Button onClick={() => { setEditingComponent(null); setComponentFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={components}
                  columns={componentColumns}
                  loading={loadingComponents}
                  searchPlaceholder="Buscar componentes..."
                  onEdit={(r) => { setEditingComponent(r); setComponentFormOpen(true); }}
                  onDelete={setDeletingComponent}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cadastro de Estoque</CardTitle>
                <Button onClick={() => { setEditingStock(null); setStockFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={stockItems}
                  columns={stockColumns}
                  loading={loadingStock}
                  searchPlaceholder="Buscar estoque..."
                  onEdit={(r) => { setEditingStock(r); setStockFormOpen(true); }}
                  onDelete={setDeletingStock}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cadastro de Manutenção</CardTitle>
                <Button onClick={() => { setEditingMaintenance(null); setMaintenanceFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={maintenanceItems}
                  columns={maintenanceColumns}
                  loading={loadingMaintenance}
                  searchPlaceholder="Buscar manutenções..."
                  onEdit={(r) => { setEditingMaintenance(r); setMaintenanceFormOpen(true); }}
                  onDelete={setDeletingMaintenance}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Forms */}
        <ComponentForm
          open={componentFormOpen}
          onOpenChange={setComponentFormOpen}
          onSubmit={(data) => {
            if (editingComponent) {
              updateComponent({ id: editingComponent.id, ...data });
            } else {
              createComponent(data as { code?: string; name: string; type?: string; description?: string; value?: number });
            }
            setComponentFormOpen(false);
          }}
          initialData={editingComponent}
          loading={isCreatingComponent || isUpdatingComponent}
        />

        <StockForm
          open={stockFormOpen}
          onOpenChange={setStockFormOpen}
          onSubmit={(data) => {
            if (editingStock) {
              updateStock({ id: editingStock.id, ...data });
            } else {
              createStock(data as { contract_id: string | null; component_id: string; quantity: number });
            }
            setStockFormOpen(false);
          }}
          initialData={editingStock}
          loading={isCreatingStock || isUpdatingStock}
        />

        <MaintenanceForm
          open={maintenanceFormOpen}
          onOpenChange={setMaintenanceFormOpen}
          onSubmit={(data) => {
            if (editingMaintenance) {
              updateMaintenance({ id: editingMaintenance.id, ...data });
            } else {
              createMaintenance(data as { contract_id: string | null; om_number: string; nf_number: string; send_date: string; return_date?: string | null; return_nf?: string | null; observations?: string | null; items: { component_id: string; quantity: number }[] });
            }
            setMaintenanceFormOpen(false);
          }}
          initialData={editingMaintenance}
          loading={isCreatingMaintenance || isUpdatingMaintenance}
        />

        {/* Delete Dialogs */}
        <DeleteDialog
          open={!!deletingComponent}
          onOpenChange={(o) => !o && setDeletingComponent(null)}
          onConfirm={() => { if (deletingComponent) { deleteComponent(deletingComponent.id); setDeletingComponent(null); } }}
          loading={isDeletingComponent}
        />

        <DeleteDialog
          open={!!deletingStock}
          onOpenChange={(o) => !o && setDeletingStock(null)}
          onConfirm={() => { if (deletingStock) { deleteStock(deletingStock.id); setDeletingStock(null); } }}
          loading={isDeletingStock}
        />

        <DeleteDialog
          open={!!deletingMaintenance}
          onOpenChange={(o) => !o && setDeletingMaintenance(null)}
          onConfirm={() => { if (deletingMaintenance) { deleteMaintenance(deletingMaintenance.id); setDeletingMaintenance(null); } }}
          loading={isDeletingMaintenance}
        />

        {/* Import Dialog */}
        <ImportDialog
          open={componentImportOpen}
          onOpenChange={setComponentImportOpen}
          onImport={handleComponentImport}
          columnMappings={componentImportConfig.mappings}
          templateColumns={componentImportConfig.templateColumns}
          templateFilename="componentes_template"
          title="Importar Componentes"
        />
      </div>
    </AppLayout>
  );
}
