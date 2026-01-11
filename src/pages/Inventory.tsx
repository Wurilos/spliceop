import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable, Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp, Package, BarChart3, Wrench, Upload, FileSpreadsheet } from 'lucide-react';
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
import { generateMaintenanceNFRequest } from '@/lib/generateMaintenanceNF';

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

const getStatusNFBadge = (status: string | null) => {
  switch (status) {
    case 'pendente_nf':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente NF</Badge>;
    case 'nf_gerada':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">NF Gerada</Badge>;
    case 'em_manutencao':
      return <Badge variant="destructive">Em Manutenção</Badge>;
    case 'retornado':
      return <Badge variant="default" className="bg-green-600">Retornado</Badge>;
    default:
      return <Badge variant="outline">{status || '-'}</Badge>;
  }
};

const maintenanceColumns: Column<StockMaintenance>[] = [
  { key: 'contracts', label: 'Contrato', render: (_, row) => row.contracts ? `${row.contracts.number}` : '-' },
  { key: 'solicitante', label: 'Solicitante', render: (v) => (v as string) || '-' },
  { key: 'send_date', label: 'Data Envio', render: (v) => v ? format(new Date(v as string), 'dd/MM/yyyy') : '-' },
  { key: 'om_number', label: 'Nº O.M', render: (v) => (v as string) || '-' },
  { key: 'nf_number', label: 'Nº NF', render: (v) => (v as string) || '-' },
  { key: 'status_nf', label: 'Status', render: (v) => getStatusNFBadge(v as string | null) },
  { key: 'stock_maintenance_items', label: 'Itens', render: (_, row) => row.stock_maintenance_items?.length || 0 },
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

  const handleGenerateNFRequest = (maintenance: StockMaintenance) => {
    // Get component details for each item
    const itemsData = maintenance.stock_maintenance_items?.map(item => {
      const component = components.find(c => c.id === item.component_id);
      return {
        component_code: component?.code || '',
        component_name: component?.name || '',
        component_value: component?.value || 0,
        quantity: item.quantity,
        barcode: item.barcode || '',
        defect_description: item.defect_description || '',
        field_service_code: item.field_service_code || '',
        equipment_serial: item.equipment_serial || '',
      };
    }) || [];

    const data = {
      id: maintenance.id,
      contract_number: maintenance.contracts?.number || '',
      contract_name: maintenance.contracts?.client_name || '',
      centro_custo: maintenance.centro_custo || '',
      remetente: maintenance.remetente || '',
      destinatario: maintenance.destinatario || 'Matriz - Manutenção',
      solicitante: maintenance.solicitante || '',
      send_date: maintenance.send_date,
      observations: maintenance.observations || '',
      items: itemsData,
    };

    try {
      const fileName = generateMaintenanceNFRequest(data);
      toast({ title: 'Planilha gerada!', description: `Arquivo ${fileName} baixado com sucesso.` });
      
      // Update status to nf_gerada
      updateMaintenance({ id: maintenance.id, status_nf: 'nf_gerada' });
    } catch (error) {
      toast({ title: 'Erro ao gerar planilha', description: String(error), variant: 'destructive' });
    }
  };

  // Custom actions for maintenance table
  const maintenanceActions = (row: StockMaintenance) => (
    <div className="flex gap-2">
      {(row.status_nf === 'pendente_nf' || !row.status_nf) && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleGenerateNFRequest(row);
          }}
          title="Gerar Pedido NF"
        >
          <FileSpreadsheet className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

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
                <CardTitle>Solicitações de Manutenção</CardTitle>
                <Button onClick={() => { setEditingMaintenance(null); setMaintenanceFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Nova Solicitação
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
                  customActions={maintenanceActions}
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
              createMaintenance({
                contract_id: data.contract_id || null,
                send_date: data.send_date,
                om_number: data.om_number || null,
                nf_number: data.nf_number || null,
                return_date: data.return_date || null,
                return_nf: data.return_nf || null,
                observations: data.observations || null,
                solicitante: data.solicitante || null,
                centro_custo: data.centro_custo || null,
                destinatario: data.destinatario || null,
                remetente: data.remetente || null,
                items: data.items,
              });
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
