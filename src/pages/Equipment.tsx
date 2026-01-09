import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useEquipment } from '@/hooks/useEquipment';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { EquipmentDashboard } from '@/components/equipment/EquipmentDashboard';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { equipmentImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, List, Monitor, Smartphone, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteDialog } from '@/components/shared/DeleteDialog';

type Equipment = Tables<'equipment'> & { contracts?: { number: string; client_name: string } | null };

const getTypeIcon = (type: string | null) => {
  switch (type?.toLowerCase()) {
    case 'cev':
      return <Monitor className="h-5 w-5 text-primary" />;
    case 'cec':
      return <Smartphone className="h-5 w-5 text-primary" />;
    default:
      return <Monitor className="h-5 w-5 text-primary" />;
  }
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'maintenance':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Em Manutenção
        </Badge>
      );
    case 'active':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Operante
        </Badge>
      );
    case 'inactive':
    case 'decommissioned':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Inativo
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Operante
        </Badge>
      );
  }
};

const exportColumns = [
  { key: 'Nº Série', label: 'Nº Série' },
  { key: 'Tipo', label: 'Tipo' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Modelo', label: 'Modelo' },
  { key: 'Localização', label: 'Localização' },
  { key: 'Status', label: 'Status' },
];

export default function EquipmentPage() {
  const { equipment, loading, create, update, delete: deleteEquipment, deleteMany, isCreating, isUpdating } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleAdd = () => {
    setEditingEquipment(null);
    setFormOpen(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormOpen(true);
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

  const handleImport = async (rows: any[]) => {
    // Buscar contratos para resolver contract_number -> contract_id
    const { data: contracts } = await supabase.from('contracts').select('id, number, client_name');

    // Aceita tanto "número" quanto "nome do cliente" como identificador do contrato
    const contractMap = new Map<string, string>();
    contracts?.forEach((c) => {
      const numberKey = c.number?.toLowerCase().trim();
      const nameKey = c.client_name?.toLowerCase().trim();
      if (numberKey) contractMap.set(numberKey, c.id);
      if (nameKey) contractMap.set(nameKey, c.id);
    });

    // Normaliza coordenadas que chegam sem separador decimal (ex: -20462591)
    // Em vez de assumir "6 casas", reduzimos por 10 até caber no range esperado.
    const normalizeCoordinate = (val: any, maxAbs: number): number | null => {
      if (val === null || val === undefined || val === '') return null;

      let num: number;
      if (typeof val === 'number') {
        num = val;
      } else {
        const s = String(val).trim().replace(',', '.');
        num = Number(s);
      }

      if (!Number.isFinite(num)) return null;

      let guard = 0;
      while (Math.abs(num) > maxAbs && guard < 20) {
        num = num / 10;
        guard++;
      }

      if (Math.abs(num) > maxAbs) return null;

      // Garante compatibilidade com numeric(10,7)
      return Math.round(num * 1e7) / 1e7;
    };

    const normalizeSpeedLimit = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const str = String(val).trim();

      // Planilha pode vir como "100/80" (dia/noite). Gravamos o primeiro valor.
      const firstPart = str.includes('/') ? str.split('/')[0] : str;
      const n = parseInt(firstPart.replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(n) ? null : n;
    };

    const normalized = rows.map((row) => {
      const r: any = { ...row };

      // Resolver contract_number (pode ser número OU nome do cliente) para contract_id
      if (r.contract_number) {
        const key = String(r.contract_number).toLowerCase().trim();
        const contractId = contractMap.get(key);
        r.contract_id = contractId || null;
        delete r.contract_number;
      }

      // Normalizar coordenadas
      r.latitude = normalizeCoordinate(r.latitude, 90);
      r.longitude = normalizeCoordinate(r.longitude, 180);

      // Normalizar velocidade (db espera integer)
      r.speed_limit = normalizeSpeedLimit(r.speed_limit);

      // Garantir nulls em campos opcionais
      r.lanes_qty = r.lanes_qty || null;
      r.direction = r.direction || null;
      r.communication_type = r.communication_type || null;
      r.energy_type = r.energy_type || null;
      r.installation_date = r.installation_date || null;

      return r;
    });

    const { error } = await supabase.from('equipment').insert(normalized);
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

  const handleDeleteClick = (eq: Equipment) => {
    setEquipmentToDelete(eq);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (equipmentToDelete) {
      deleteEquipment(equipmentToDelete.id);
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    }
  };

  const totalPages = Math.ceil(equipment.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEquipment = equipment.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AppLayout title="Equipamentos">
      <div className="space-y-6">
        <PageHeader
          title="Equipamentos"
          description="Gerencie CEV, CEC, REV e SAT"
          onAdd={handleAdd}
          addLabel="Novo Equipamento"
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
        />

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Listagem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <EquipmentDashboard />
          </TabsContent>

          <TabsContent value="list">
            <div className="bg-card rounded-lg border">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nº Série</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contrato</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Localização</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Equipe</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Próx. Aferição</th>
                          <th className="py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedEquipment.map((eq) => (
                          <tr key={eq.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-medium text-primary">{eq.serial_number}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(eq.type)}
                                <span>{eq.type || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {eq.contracts?.client_name || 'N/A'}
                            </td>
                            <td className="py-3 px-4">{eq.address || 'N/A'}</td>
                            <td className="py-3 px-4">{getStatusBadge(eq.status)}</td>
                            <td className="py-3 px-4 text-muted-foreground">-</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {eq.next_calibration_date
                                ? format(new Date(eq.next_calibration_date), 'dd/MM/yyyy')
                                : '-'}
                            </td>
                            <td className="py-3 px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(eq)}>
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteClick(eq)}
                                  >
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, equipment.length)} de {equipment.length} registros
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        &lt;
                      </Button>
                      <span className="text-sm">
                        Página {currentPage} de {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        &gt;
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <EquipmentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingEquipment}
          loading={isCreating || isUpdating}
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

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Excluir Equipamento"
          description={`Tem certeza que deseja excluir o equipamento ${equipmentToDelete?.serial_number}?`}
        />
      </div>
    </AppLayout>
  );
}