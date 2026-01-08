import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, LayoutDashboard, Tag, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { SealForm } from '@/components/seals/SealForm';
import { SealCard } from '@/components/seals/SealCard';
import { useSeals, Seal } from '@/hooks/useSeals';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { sealImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  installed: 'Instalado',
  lost: 'Perdido',
  damaged: 'Danificado',
};

export default function Seals() {
  const { seals, isLoading, deleteSeal } = useSeals();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedSeal, setSelectedSeal] = useState<Seal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('received');

  // Filter seals based on tab and search
  const filteredSeals = useMemo(() => {
    let filtered = seals;

    // Filter by tab
    if (activeTab === 'received') {
      filtered = seals.filter(s => s.status === 'available' || !s.equipment_id);
    } else if (activeTab === 'service-orders') {
      filtered = seals.filter(s => s.status === 'installed' && s.equipment_id);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.seal_number.toLowerCase().includes(term) ||
        s.seal_type?.toLowerCase().includes(term) ||
        s.memo_number?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [seals, activeTab, searchTerm]);

  const handleEdit = (seal: Seal) => {
    setSelectedSeal(seal);
    setFormOpen(true);
  };

  const handleDelete = (seal: Seal) => {
    setSelectedSeal(seal);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSeal) {
      deleteSeal(selectedSeal.id);
      setDeleteOpen(false);
      setSelectedSeal(null);
    }
  };

  const exportColumns = [
    { key: 'Número do Lacre', label: 'Número do Lacre' },
    { key: 'Tipo', label: 'Tipo' },
    { key: 'Data Recebimento', label: 'Data Recebimento' },
    { key: 'Memorando', label: 'Memorando' },
    { key: 'Status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = filteredSeals.map((s) => ({
      'Número do Lacre': s.seal_number,
      'Tipo': s.seal_type || '',
      'Data Recebimento': s.received_date ? format(new Date(s.received_date), 'dd/MM/yyyy') : '',
      'Memorando': s.memo_number || '',
      'Status': STATUS_LABELS[s.status] || s.status,
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Lacres');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'lacres');
    else exportToCSV(data, exportColumns, 'lacres');
  };

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('seals').insert(data);
    if (error) throw error;
    toast.success(`${data.length} registros importados com sucesso!`);
  };

  const receivedCount = seals.filter(s => s.status === 'available' || !s.equipment_id).length;
  const serviceOrdersCount = seals.filter(s => s.status === 'installed' && s.equipment_id).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">Lacres</h1>
            <p className="text-muted-foreground">Controle de recebimento e instalação de lacres de segurança</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Lacres Recebidos
            </TabsTrigger>
            <TabsTrigger value="service-orders" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ordens de Serviços
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-semibold text-lg mb-2">Total de Lacres</h3>
                <p className="text-3xl font-bold text-primary">{seals.length}</p>
              </div>
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-semibold text-lg mb-2">Disponíveis</h3>
                <p className="text-3xl font-bold text-green-600">{receivedCount}</p>
              </div>
              <div className="border rounded-lg p-6 bg-card">
                <h3 className="font-semibold text-lg mb-2">Instalados</h3>
                <p className="text-3xl font-bold text-blue-600">{serviceOrdersCount}</p>
              </div>
            </div>
          </TabsContent>

          {/* Lacres Recebidos Tab */}
          <TabsContent value="received" className="mt-6">
            <div className="space-y-4">
              {/* Search and Actions */}
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">
                  Lacres Recebidos ({filteredSeals.length})
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar lacres..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button onClick={() => { setSelectedSeal(null); setFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Lacre
                  </Button>
                </div>
              </div>

              {/* Cards Grid */}
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-lg" />
                  ))}
                </div>
              ) : filteredSeals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum lacre encontrado.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredSeals.map((seal) => (
                    <SealCard
                      key={seal.id}
                      seal={seal}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Ordens de Serviços Tab */}
          <TabsContent value="service-orders" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">
                  Ordens de Serviços ({filteredSeals.length})
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar lacres..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-lg" />
                  ))}
                </div>
              ) : filteredSeals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma ordem de serviço encontrada.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredSeals.map((seal) => (
                    <SealCard
                      key={seal.id}
                      seal={seal}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <SealForm
          open={formOpen}
          onOpenChange={setFormOpen}
          seal={selectedSeal}
        />

        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={confirmDelete}
          title="Excluir Lacre"
          description="Tem certeza que deseja excluir este lacre?"
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImport={handleImport}
          title="Importar Lacres"
          columnMappings={sealImportConfig.mappings}
          templateColumns={sealImportConfig.templateColumns}
          templateFilename="template_lacres"
        />
      </div>
    </AppLayout>
  );
}
