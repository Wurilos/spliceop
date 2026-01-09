import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useVehicles } from '@/hooks/useVehicles';
import { VehicleForm } from '@/components/vehicles/VehicleForm';
import { Tables } from '@/integrations/supabase/types';
import { vehicleImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { Car, MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteDialog } from '@/components/shared/DeleteDialog';

type Vehicle = Tables<'vehicles'> & { contracts?: { number: string; client_name: string } | null };

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'maintenance':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Manutenção
        </Badge>
      );
    case 'active':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Em Uso
        </Badge>
      );
    case 'inactive':
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Inativo
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Em Uso
        </Badge>
      );
  }
};

const exportColumns = [
  { key: 'Contrato', label: 'Contrato' },
  { key: 'Placa', label: 'Placa' },
  { key: 'Modelo', label: 'Modelo' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Ano', label: 'Ano' },
  { key: 'Combustível', label: 'Combustível' },
  { key: 'KM Atual', label: 'KM Atual' },
  { key: 'RENAVAM', label: 'RENAVAM' },
  { key: 'Chassi', label: 'Chassi' },
  { key: 'Data Disponibilização', label: 'Data Disponibilização' },
  { key: 'Número Cartão', label: 'Número Cartão' },
  { key: 'Saldo Mensal', label: 'Saldo Mensal' },
  { key: 'Número TAG', label: 'Número TAG' },
  { key: 'Status', label: 'Status' },
  { key: 'Observações', label: 'Observações' },
];

export default function Vehicles() {
  const { vehicles, loading, create, update, delete: deleteVehicle, deleteMany, isCreating, isUpdating } = useVehicles();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [deleteManyDialogOpen, setDeleteManyDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: Partial<Vehicle>) => {
    if (editingVehicle) {
      update({ id: editingVehicle.id, ...data });
    } else {
      create(data as any);
    }
    setFormOpen(false);
    setEditingVehicle(null);
  };

  const handleImport = async (rows: any[]) => {
    const normalizeContractKey = (value: any) => {
      if (value === null || value === undefined) return '';
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/[–—−]/g, '-') // normaliza traços unicode
        .replace(/\s+/g, ' ') // colapsa espaços
        .replace(/\s*-\s*/g, ' - '); // normaliza " - "
    };

    // Buscar contratos para resolver contract_number -> contract_id
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, number, client_name');

    if (contractsError) throw contractsError;

    // Cria mapa para lookup flexível (number, client_name, "number - client_name")
    const contractMap = new Map<string, string>();
    contracts?.forEach((c) => {
      const num = c.number?.trim() || '';
      const name = c.client_name?.trim() || '';

      if (num) contractMap.set(normalizeContractKey(num), c.id);
      if (name) contractMap.set(normalizeContractKey(name), c.id);
      if (num && name) contractMap.set(normalizeContractKey(`${num} - ${name}`), c.id);
    });

    const normalized = rows.map((row) => {
      const r: any = { ...row };

      // Normalizar placa (garante consistência e evita duplicidade por caixa/espaços)
      if (r.plate) r.plate = String(r.plate).toUpperCase().trim();

      // Resolver contract_number (pode vir como "CTR-0002 - Barretos")
      if (r.contract_number) {
        const raw = String(r.contract_number).trim();
        const normalizedRaw = normalizeContractKey(raw);

        let contractId = contractMap.get(normalizedRaw);

        // fallback: tenta extrair número e nome (quando vier combinado)
        if (!contractId && normalizedRaw.includes(' - ')) {
          const parts = normalizedRaw.split(' - ');
          const numberPart = parts[0]?.trim();
          const namePart = parts.slice(1).join(' - ').trim();
          contractId = (numberPart ? contractMap.get(numberPart) : undefined) || (namePart ? contractMap.get(namePart) : undefined);
        }

        // IMPORTANTE: só setar contract_id quando encontrado (para não "zerar" vínculo em upserts)
        if (contractId) r.contract_id = contractId;
        delete r.contract_number;
      }

      return r;
    });

    // Upsert para evitar erro de "placa já existe" (UNIQUE plate)
    const { error } = await supabase.from('vehicles').upsert(normalized, { onConflict: 'plate' });
    if (error) throw error;
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = vehicles.map((v) => ({
      'Contrato': (v as any).contracts?.number || '',
      'Placa': v.plate,
      'Modelo': v.model || '',
      'Marca': v.brand || '',
      'Ano': v.year || '',
      'Combustível': v.fuel_type || '',
      'KM Atual': v.current_km || '',
      'RENAVAM': v.renavam || '',
      'Chassi': v.chassis || '',
      'Data Disponibilização': v.availability_date || '',
      'Número Cartão': v.fuel_card || '',
      'Saldo Mensal': v.monthly_balance || '',
      'Número TAG': v.tag_number || '',
      'Status': v.status || '',
      'Observações': v.notes || '',
    }));
    if (type === 'pdf') exportToPDF(data, exportColumns, 'Veículos');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'veiculos');
    else exportToCSV(data, exportColumns, 'veiculos');
  };

  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (vehicleToDelete) {
      deleteVehicle(vehicleToDelete.id);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const handleConfirmDeleteMany = () => {
    if (selectedIds.length > 0) {
      deleteMany(selectedIds);
      setDeleteManyDialogOpen(false);
      setSelectedIds([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedVehicles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedVehicles.map((v) => v.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVehicles = vehicles.slice(startIndex, startIndex + itemsPerPage);

  const allSelected = paginatedVehicles.length > 0 && selectedIds.length === paginatedVehicles.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < paginatedVehicles.length;

  return (
    <AppLayout title="Veículos">
      <div className="space-y-6">
        <PageHeader
          title="Veículos"
          description="Gerencie a frota de veículos"
          onAdd={handleAdd}
          addLabel="Novo Veículo"
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
        />

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg border">
            <span className="text-sm font-medium">{selectedIds.length} veículo(s) selecionado(s)</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteManyDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Selecionados
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
              Limpar Seleção
            </Button>
          </div>
        )}

        <div className="bg-card rounded-lg border">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1500px]">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-3 w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todos"
                          className={someSelected ? 'opacity-50' : ''}
                        />
                      </th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Contrato</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Placa</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Modelo</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Marca</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Ano</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Combustível</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">KM Atual</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">RENAVAM</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Chassi</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Data Disp.</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Nº Cartão</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Saldo Mensal</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Nº TAG</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Status</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Observações</th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-3">
                          <Checkbox
                            checked={selectedIds.includes(vehicle.id)}
                            onCheckedChange={() => toggleSelect(vehicle.id)}
                            aria-label={`Selecionar ${vehicle.plate}`}
                          />
                        </td>
                        <td className="py-2 px-3 text-sm">{(vehicle as any).contracts?.client_name || '-'}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <Car className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="font-medium text-sm">{vehicle.plate}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-sm">{vehicle.model || '-'}</td>
                        <td className="py-2 px-3 text-sm">{vehicle.brand || '-'}</td>
                        <td className="py-2 px-3 text-sm">{vehicle.year || '-'}</td>
                        <td className="py-2 px-3 text-sm">{vehicle.fuel_type || '-'}</td>
                        <td className="py-2 px-3 text-sm">
                          {vehicle.current_km ? `${vehicle.current_km.toLocaleString('pt-BR')} km` : '-'}
                        </td>
                        <td className="py-2 px-3 text-sm">{vehicle.renavam || '-'}</td>
                        <td className="py-2 px-3 text-sm max-w-[120px] truncate" title={vehicle.chassis || ''}>
                          {vehicle.chassis || '-'}
                        </td>
                        <td className="py-2 px-3 text-sm">
                          {vehicle.availability_date ? new Date(vehicle.availability_date).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-2 px-3 text-sm">{vehicle.fuel_card || '-'}</td>
                        <td className="py-2 px-3 text-sm">
                          {vehicle.monthly_balance ? `R$ ${vehicle.monthly_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-sm">{vehicle.tag_number || '-'}</td>
                        <td className="py-2 px-3">{getStatusBadge(vehicle.status)}</td>
                        <td className="py-2 px-3 text-sm max-w-[100px] truncate" title={vehicle.notes || ''}>
                          {vehicle.notes || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteClick(vehicle)}
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
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, vehicles.length)} de {vehicles.length} registros
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

        <VehicleForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingVehicle}
          loading={isCreating || isUpdating}
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Veículos"
          description="Importe veículos a partir de uma planilha Excel"
          columnMappings={vehicleImportConfig.mappings}
          templateColumns={vehicleImportConfig.templateColumns}
          templateFilename="veiculos"
          onImport={handleImport}
        />

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Excluir Veículo"
          description={`Tem certeza que deseja excluir o veículo ${vehicleToDelete?.plate}?`}
        />

        <DeleteDialog
          open={deleteManyDialogOpen}
          onOpenChange={setDeleteManyDialogOpen}
          onConfirm={handleConfirmDeleteMany}
          title="Excluir Veículos Selecionados"
          description={`Tem certeza que deseja excluir ${selectedIds.length} veículo(s)?`}
        />
      </div>
    </AppLayout>
  );
}