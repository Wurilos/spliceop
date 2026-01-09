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
import { Car, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  { key: 'Placa', label: 'Placa' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Modelo', label: 'Modelo' },
  { key: 'Ano', label: 'Ano' },
  { key: 'Cor', label: 'Cor' },
  { key: 'Status', label: 'Status' },
];

export default function Vehicles() {
  const { vehicles, loading, create, update, delete: deleteVehicle, deleteMany, isCreating, isUpdating } = useVehicles();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
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

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('vehicles').insert(data);
    if (error) throw error;
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = vehicles.map((v) => ({
      'Placa': v.plate,
      'Marca': v.brand || '',
      'Modelo': v.model || '',
      'Ano': v.year || '',
      'Cor': v.color || '',
      'Status': v.status || '',
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

  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVehicles = vehicles.slice(startIndex, startIndex + itemsPerPage);

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
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Placa</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Equipe Associada</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Car className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium">{vehicle.plate}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{vehicle.model || '-'}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {(vehicle as any).team || '-'}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(vehicle.status)}</td>
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
      </div>
    </AppLayout>
  );
}