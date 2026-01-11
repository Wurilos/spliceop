import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable, Column } from '@/components/shared/DataTable';
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
import { Plus, LayoutDashboard, List, FileDown, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type Calibration = Tables<'calibrations'> & { 
  equipment?: { 
    serial_number: string; 
    type: string | null; 
    brand: string | null; 
    contract_id?: string | null;
    lanes_qty?: number | null;
  } | null;
  contract_name?: string;
};

// Custom status badge with color scale for calibrations
function CalibrationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { className: string; label: string }> = {
    valid: { className: 'bg-emerald-500 text-white hover:bg-emerald-600', label: 'Válido' },
    pending: { className: 'bg-amber-500 text-white hover:bg-amber-600', label: 'Pendente' },
    expired: { className: 'bg-red-500 text-white hover:bg-red-600', label: 'Vencido' },
  };
  const { className, label } = config[status] || { className: 'bg-muted text-muted-foreground', label: status };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${className}`}>{label}</span>;
}

const columns: Column<Calibration>[] = [
  { key: 'contract_name', label: 'Contrato' },
  { key: 'equipment.serial_number', label: 'Equipamento', render: (_, row) => row.equipment?.serial_number || '-' },
  { key: 'equipment.type', label: 'Tipo', render: (_, row) => row.equipment?.type || '-' },
  { key: 'calibration_date', label: 'Data Aferição', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'expiration_date', label: 'Validade', render: (v) => format(new Date(String(v)), 'dd/MM/yyyy') },
  { key: 'certificate_number', label: 'Certificado' },
  { key: 'inmetro_number', label: 'Nº INMETRO' },
  { key: 'status', label: 'Status', render: (v) => <CalibrationStatusBadge status={String(v || 'valid')} /> },
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
  
  // Filters
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [expirationFilter, setExpirationFilter] = useState<string>('all');

  // Add contract info to calibrations based on equipment
  const calibrationsWithContract = useMemo(() => {
    return calibrations.map(cal => {
      const equipmentItem = equipment.find(e => e.serial_number === cal.equipment?.serial_number);
      const contract = contracts.find(c => c.id === equipmentItem?.contract_id);
      return {
        ...cal,
        equipment: cal.equipment ? {
          ...cal.equipment,
          contract_id: equipmentItem?.contract_id
        } : null,
        contract_name: contract?.client_name || 'Sem Contrato'
      };
    });
  }, [calibrations, equipment, contracts]);

  // Filter calibrations based on selected filters
  const filteredCalibrations = useMemo(() => {
    let filtered = calibrationsWithContract;

    // Filter by contract
    if (contractFilter !== 'all') {
      filtered = filtered.filter(cal => {
        const equipmentItem = equipment.find(e => e.serial_number === cal.equipment?.serial_number);
        return equipmentItem?.contract_id === contractFilter;
      });
    }

    // Filter by expiration status
    if (expirationFilter !== 'all') {
      const today = new Date();
      const next30Days = new Date();
      next30Days.setDate(today.getDate() + 30);

      filtered = filtered.filter(cal => {
        if (!cal.expiration_date) return false;
        const expDate = new Date(cal.expiration_date);

        switch (expirationFilter) {
          case 'expired':
            return expDate < today;
          case 'expiring_30':
            return expDate >= today && expDate <= next30Days;
          case 'valid':
            return expDate > next30Days;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [calibrationsWithContract, contractFilter, expirationFilter, equipment]);

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const exportColumns = columns.map(c => ({ key: String(c.key), label: c.label }));
    if (type === 'pdf') exportToPDF(calibrations, exportColumns, 'Aferições');
    else if (type === 'excel') exportToExcel(calibrations, exportColumns, 'Aferições');
    else exportToCSV(calibrations, exportColumns, 'Aferições');
  };

  const handleImport = async (data: any[]) => {
    // Resolve contract and equipment, then calculate expiration date
    const dataWithEquipment = data.map(d => {
      // Resolve contract by number or client name
      const contract = contracts.find(c => 
        c.number?.toLowerCase() === d.contract_ref?.toLowerCase() ||
        c.client_name?.toLowerCase() === d.contract_ref?.toLowerCase()
      );
      
      if (!contract) {
        throw new Error(`Contrato não encontrado: ${d.contract_ref}`);
      }

      // Find equipment by serial within the contract
      const equipmentItem = equipment.find(e => 
        e.serial_number?.toLowerCase() === d.equipment_serial?.toLowerCase() &&
        e.contract_id === contract.id
      );
      
      if (!equipmentItem) {
        throw new Error(`Equipamento "${d.equipment_serial}" não encontrado no contrato "${d.contract_ref}"`);
      }

      // Calculate expiration date (1 year from calibration)
      let expirationDate = d.expiration_date;
      if (!expirationDate && d.calibration_date) {
        const calibDate = new Date(d.calibration_date);
        calibDate.setFullYear(calibDate.getFullYear() + 1);
        expirationDate = calibDate.toISOString().split('T')[0];
      }

      const { equipment_serial, contract_ref, ...rest } = d;
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
          <TabsContent value="list" className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contract-filter" className="text-xs">Contrato</Label>
                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger id="contract-filter" className="w-[200px]">
                    <SelectValue placeholder="Todos os contratos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os contratos</SelectItem>
                    {contracts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expiration-filter" className="text-xs">Vencimento</Label>
                <Select value={expirationFilter} onValueChange={setExpirationFilter}>
                  <SelectTrigger id="expiration-filter" className="w-[180px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="expired">Vencidos</SelectItem>
                    <SelectItem value="expiring_30">Próximos 30 dias</SelectItem>
                    <SelectItem value="valid">Válidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(contractFilter !== 'all' || expirationFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setContractFilter('all'); setExpirationFilter('all'); }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            <DataTable 
              data={filteredCalibrations} 
              columns={columns} 
              loading={loading} 
              searchPlaceholder="Buscar por Nº equipamento..." 
              searchKey="equipment.serial_number"
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
