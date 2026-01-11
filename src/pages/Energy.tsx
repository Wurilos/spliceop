import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { EnergyForm } from '@/components/energy/EnergyForm';
import { SupplierForm } from '@/components/energy/SupplierForm';
import { ConsumerUnitForm } from '@/components/energy/ConsumerUnitForm';
import { EnergyDashboard } from '@/components/energy/EnergyDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnergyBills } from '@/hooks/useEnergyBills';
import { useEnergySuppliers, EnergySupplier } from '@/hooks/useEnergySuppliers';
import { useEnergyConsumerUnits, EnergyConsumerUnit } from '@/hooks/useEnergyConsumerUnits';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { energyImportConfig, energyConsumerUnitImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Energy() {
  const { energyBills, isLoading: billsLoading, deleteEnergyBill } = useEnergyBills();
  const { suppliers, isLoading: suppliersLoading, deleteSupplier } = useEnergySuppliers();
  const { consumerUnits, isLoading: unitsLoading, deleteConsumerUnit } = useEnergyConsumerUnits();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('suppliers');
  const [formOpen, setFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [unitImportOpen, setUnitImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<EnergySupplier | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<EnergyConsumerUnit | null>(null);
  const [deleteContext, setDeleteContext] = useState<'bill' | 'supplier' | 'unit'>('bill');

  const getContractName = (contractId: string | null) => {
    if (!contractId) return '-';
    const contract = contracts.find((c) => c.id === contractId);
    return contract?.client_name || '-';
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return '-';
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || '-';
  };

  const getEquipmentSerial = (equipmentId: string | null) => {
    if (!equipmentId) return '-';
    const eq = equipment.find((e) => e.id === equipmentId);
    return eq?.serial_number || '-';
  };

  // Columns for Suppliers
  const supplierColumns = [
    { key: 'name', label: 'Nome' },
    { key: 'address', label: 'Endereço', render: (v: string | null) => v || '-' },
    { key: 'city', label: 'Cidade', render: (v: string | null) => v || '-' },
    { key: 'contact', label: 'Contato', render: (v: string | null) => v || '-' },
  ];

  // Columns for Consumer Units
  const unitColumns = [
    { key: 'consumer_unit', label: 'Unidade Consumidora' },
    {
      key: 'supplier_id',
      label: 'Fornecedor',
      render: (v: string | null) => getSupplierName(v),
    },
    {
      key: 'contract_id',
      label: 'Contrato',
      render: (v: string | null) => getContractName(v),
    },
    {
      key: 'equipment_id',
      label: 'Equipamento',
      render: (v: string | null) => getEquipmentSerial(v),
    },
  ];

  // Columns for Bills
  const billColumns = [
    { key: 'consumer_unit', label: 'Unidade Consumidora' },
    {
      key: 'reference_month',
      label: 'Mês Referência',
      render: (value: string) => format(new Date(value), 'MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'contract_id',
      label: 'Contrato',
      render: (value: string | null) => getContractName(value),
    },
    {
      key: 'value',
      label: 'Valor',
      render: (value: number | null) =>
        value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  const handleAdd = () => {
    if (activeTab === 'suppliers') {
      setSelectedSupplier(null);
      setSupplierFormOpen(true);
    } else if (activeTab === 'units') {
      setSelectedUnit(null);
      setUnitFormOpen(true);
    } else if (activeTab === 'bills') {
      setSelectedBill(null);
      setFormOpen(true);
    }
  };

  const handleEditSupplier = (supplier: EnergySupplier) => {
    setSelectedSupplier(supplier);
    setSupplierFormOpen(true);
  };

  const handleDeleteSupplier = (supplier: EnergySupplier) => {
    setSelectedSupplier(supplier);
    setDeleteContext('supplier');
    setDeleteOpen(true);
  };

  const handleEditUnit = (unit: EnergyConsumerUnit) => {
    setSelectedUnit(unit);
    setUnitFormOpen(true);
  };

  const handleDeleteUnit = (unit: EnergyConsumerUnit) => {
    setSelectedUnit(unit);
    setDeleteContext('unit');
    setDeleteOpen(true);
  };

  const handleEditBill = (bill: any) => {
    setSelectedBill(bill);
    setFormOpen(true);
  };

  const handleDeleteBill = (bill: any) => {
    setSelectedBill(bill);
    setDeleteContext('bill');
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (deleteContext === 'supplier' && selectedSupplier) {
      deleteSupplier(selectedSupplier.id);
    } else if (deleteContext === 'unit' && selectedUnit) {
      deleteConsumerUnit(selectedUnit.id);
    } else if (deleteContext === 'bill' && selectedBill) {
      deleteEnergyBill(selectedBill.id);
    }
    setDeleteOpen(false);
    setSelectedSupplier(null);
    setSelectedUnit(null);
    setSelectedBill(null);
  };

  const exportColumns = [
    { key: 'Unidade Consumidora', label: 'Unidade Consumidora' },
    { key: 'Mês Referência', label: 'Mês Referência' },
    { key: 'Contrato', label: 'Contrato' },
    { key: 'Valor', label: 'Valor' },
    { key: 'Status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = energyBills.map((b) => ({
      'Unidade Consumidora': b.consumer_unit,
      'Mês Referência': format(new Date(b.reference_month), 'MM/yyyy'),
      Contrato: getContractName(b.contract_id),
      Valor: b.value || '',
      Status: b.status || '',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Contas de Energia');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'energia');
    else exportToCSV(data, exportColumns, 'energia');
  };

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('energy_bills').insert(data);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['energy_bills'] });
    toast.success(`${data.length} faturas importadas com sucesso!`);
  };

  const handleUnitImport = async (data: any[]) => {
    const resolvedData = data.map((row, index) => {
      const rowNumber = index + 2;

      // Resolve supplier by name
      let supplierId: string | null = null;
      if (row.supplier_name) {
        const supplierName = String(row.supplier_name).trim().toLowerCase();
        const supplier = suppliers.find((s) => s.name?.toLowerCase() === supplierName);
        if (supplier) supplierId = supplier.id;
      }

      // Resolve contract by name/number
      let contractId: string | null = null;
      if (row.contract_ref) {
        const contractRef = String(row.contract_ref).trim().toLowerCase();
        const contract = contracts.find((c) => {
          const number = (c.number || '').toLowerCase();
          const name = (c.client_name || '').toLowerCase();
          const combined = `${c.number} - ${c.client_name}`.toLowerCase();
          return combined === contractRef || name === contractRef || number === contractRef;
        });
        if (contract) contractId = contract.id;
      }

      // Resolve equipment by serial
      let equipmentId: string | null = null;
      if (row.equipment_serial) {
        const serial = String(row.equipment_serial).trim().toUpperCase();
        const eq = equipment.find((e) => e.serial_number?.toUpperCase() === serial);
        if (eq) equipmentId = eq.id;
      }

      return {
        consumer_unit: row.consumer_unit,
        supplier_id: supplierId,
        contract_id: contractId,
        equipment_id: equipmentId,
      };
    });

    const { error } = await supabase.from('energy_consumer_units').insert(resolvedData);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['energy_consumer_units'] });
    toast.success(`${resolvedData.length} unidades consumidoras importadas com sucesso!`);
  };

  const getDeleteMessage = () => {
    if (deleteContext === 'supplier') return 'Tem certeza que deseja excluir este fornecedor?';
    if (deleteContext === 'unit') return 'Tem certeza que deseja excluir esta unidade consumidora?';
    return 'Tem certeza que deseja excluir esta conta de energia?';
  };

  return (
    <AppLayout>
      <PageHeader
        title="Energia"
        description="Controle de consumo de energia elétrica"
        onAdd={activeTab !== 'dashboard' ? handleAdd : undefined}
        onExport={activeTab === 'bills' ? handleExport : undefined}
        onImport={
          activeTab === 'bills'
            ? () => setImportOpen(true)
            : activeTab === 'units'
            ? () => setUnitImportOpen(true)
            : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="units">Unidade Consumidora</TabsTrigger>
          <TabsTrigger value="bills">Faturas Mensais</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <DataTable
            data={suppliers}
            columns={supplierColumns}
            loading={suppliersLoading}
            searchPlaceholder="Buscar fornecedor..."
            onEdit={handleEditSupplier}
            onDelete={handleDeleteSupplier}
          />
        </TabsContent>

        <TabsContent value="units">
          <DataTable
            data={consumerUnits}
            columns={unitColumns}
            loading={unitsLoading}
            searchPlaceholder="Buscar unidade consumidora..."
            onEdit={handleEditUnit}
            onDelete={handleDeleteUnit}
          />
        </TabsContent>

        <TabsContent value="bills">
          <DataTable
            data={energyBills}
            columns={billColumns}
            loading={billsLoading}
            searchPlaceholder="Buscar por unidade..."
            onEdit={handleEditBill}
            onDelete={handleDeleteBill}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <EnergyDashboard />
        </TabsContent>
      </Tabs>

      <SupplierForm
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        supplier={selectedSupplier}
      />

      <ConsumerUnitForm
        open={unitFormOpen}
        onOpenChange={setUnitFormOpen}
        unit={selectedUnit}
      />

      <EnergyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        bill={selectedBill}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Registro"
        description={getDeleteMessage()}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar Contas de Energia"
        description="Importe contas de energia a partir de uma planilha Excel"
        columnMappings={energyImportConfig.mappings}
        templateColumns={energyImportConfig.templateColumns}
        templateFilename="energia"
        onImport={handleImport}
      />

      <ImportDialog
        open={unitImportOpen}
        onOpenChange={setUnitImportOpen}
        title="Importar Unidades Consumidoras"
        description="Importe unidades consumidoras a partir de uma planilha Excel"
        columnMappings={energyConsumerUnitImportConfig.mappings}
        templateColumns={energyConsumerUnitImportConfig.templateColumns}
        templateFilename="unidades_consumidoras"
        onImport={handleUnitImport}
      />
    </AppLayout>
  );
}
