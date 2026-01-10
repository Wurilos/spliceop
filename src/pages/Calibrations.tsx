import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useCalibrations } from '@/hooks/useCalibrations';
import { useContracts } from '@/hooks/useContracts';
import { CalibrationForm } from '@/components/calibrations/CalibrationForm';
import { CalibrationsDashboard } from '@/components/calibrations/CalibrationsDashboard';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { calibrationImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { useEquipment } from '@/hooks/useEquipment';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, List, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Calibration = Tables<'calibrations'> & { equipment?: { serial_number: string; type: string | null; brand: string | null; contract_id?: string | null } | null };

const columns: Column<Calibration>[] = [
  { key: 'equipment.serial_number', label: 'Equipamento', render: (_, row) => row.equipment?.serial_number || '-' },
  { key: 'equipment.type', label: 'Tipo', render: (_, row) => row.equipment?.type || '-' },
  { key: 'calibration_date', label: 'Data Aferição', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'expiration_date', label: 'Validade', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'certificate_number', label: 'Certificado' },
  { key: 'inmetro_number', label: 'Nº INMETRO' },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v || 'valid')} /> },
];

export default function Calibrations() {
  const { calibrations, loading, create, update, delete: deleteRecord, isCreating, isUpdating, isDeleting } = useCalibrations();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Calibration | null>(null);
  const [deleting, setDeleting] = useState<Calibration | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Add contract_id to calibrations based on equipment
  const calibrationsWithContract = calibrations.map(cal => ({
    ...cal,
    equipment: cal.equipment ? {
      ...cal.equipment,
      contract_id: equipment.find(e => e.serial_number === cal.equipment?.serial_number)?.contract_id
    } : null
  }));

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (type === 'pdf') exportToPDF(calibrations, exportColumns, 'Aferições');
    else if (type === 'excel') exportToExcel(calibrations, exportColumns, 'Aferições');
    else exportToCSV(calibrations, exportColumns, 'Aferições');
  };

  const handleImport = async (data: any[]) => {
    // Resolve equipment by serial_number and calculate expiration date
    const dataWithEquipment = data.map(d => {
      const equipmentItem = equipment.find(e => 
        e.serial_number?.toLowerCase() === d.equipment_serial?.toLowerCase()
      );
      
      if (!equipmentItem) {
        throw new Error(`Equipamento não encontrado: ${d.equipment_serial}`);
      }

      // Calculate expiration date (1 year from calibration)
      let expirationDate = d.expiration_date;
      if (!expirationDate && d.calibration_date) {
        const calibDate = new Date(d.calibration_date);
        calibDate.setFullYear(calibDate.getFullYear() + 1);
        expirationDate = calibDate.toISOString().split('T')[0];
      }

      const { equipment_serial, ...rest } = d;
      return { 
        ...rest, 
        equipment_id: equipmentItem.id,
        expiration_date: expirationDate
      };
    });
    
    const { error } = await supabase.from('calibrations').insert(dataWithEquipment);
    if (error) throw error;
    window.location.reload();
  };

  return (
    <AppLayout title="Aferições">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Aferições</h1>
              <p className="text-muted-foreground">Calibrações INMETRO de equipamentos</p>
            </div>
            <div className="flex items-center gap-2">
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
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                Importar
              </Button>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Aferição
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Listagem
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <CalibrationsDashboard 
              calibrations={calibrationsWithContract} 
              contracts={contracts.map(c => ({ id: c.id, number: c.number, client_name: c.client_name }))} 
            />
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="list" className="mt-6">
            <DataTable 
              data={calibrations} 
              columns={columns} 
              loading={loading} 
              searchPlaceholder="Buscar..." 
              onEdit={(r) => { setEditing(r); setFormOpen(true); }} 
              onDelete={setDeleting} 
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CalibrationForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          onSubmit={(data) => { 
            editing ? update({ id: editing.id, ...data }) : create(data as any); 
            setFormOpen(false); 
          }} 
          initialData={editing} 
          loading={isCreating || isUpdating} 
        />
        <DeleteDialog 
          open={!!deleting} 
          onOpenChange={(o) => !o && setDeleting(null)} 
          onConfirm={() => { 
            if (deleting) { 
              deleteRecord(deleting.id); 
              setDeleting(null); 
            } 
          }} 
          loading={isDeleting} 
        />
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Aferições"
          description="Importe aferições a partir de uma planilha Excel"
          columnMappings={calibrationImportConfig.mappings}
          templateColumns={calibrationImportConfig.templateColumns}
          templateFilename="afericoes"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
