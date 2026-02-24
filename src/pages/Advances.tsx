import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { AdvanceForm } from '@/components/advances/AdvanceForm';
import { AdvancesDashboard } from '@/components/advances/AdvancesDashboard';
import { useAdvances } from '@/hooks/useAdvances';
import { useEmployees } from '@/hooks/useEmployees';
import { useContracts } from '@/hooks/useContracts';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { advanceImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, List } from 'lucide-react';

export default function Advances() {
  const queryClient = useQueryClient();
  const { advances, isLoading, deleteAdvance, deleteMany } = useAdvances();
  const { employees } = useEmployees();
  const { contracts } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.full_name || '-';
  };

  const getContractName = (contractId: string | null) => {
    if (!contractId) return '-';
    const contract = contracts.find((c) => c.id === contractId);
    return contract ? `${contract.number} - ${contract.client_name}` : '-';
  };

  const columns = [
    {
      key: 'request_date',
      label: 'Data Solicitação',
      render: (value: string) => {
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
      },
    },
    {
      key: 'contract_id',
      label: 'Contrato',
      render: (value: string | null) => getContractName(value),
    },
    {
      key: 'employee_id',
      label: 'Colaborador',
      render: (value: string) => getEmployeeName(value),
    },
    { key: 'intranet', label: 'Intranet' },
    {
      key: 'requested_value',
      label: 'Valor Solicitado',
      render: (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    {
      key: 'proven_value',
      label: 'Valor Comprovado',
      render: (value: number) =>
        (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    {
      key: 'balance',
      label: 'Saldo a Devolver',
      render: (_: any, row: any) => {
        const balance = Math.max(0, (row.requested_value || 0) - (row.proven_value || 0));
        return balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      },
    },
    {
      key: 'closing_date',
      label: 'Data Fechamento',
      render: (value: string | null) => {
        if (!value) return '-';
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  const handleEdit = (advance: any) => {
    setSelectedAdvance(advance);
    setFormOpen(true);
  };

  const handleDelete = (advance: any) => {
    setSelectedAdvance(advance);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAdvance) {
      deleteAdvance(selectedAdvance.id);
      setDeleteOpen(false);
      setSelectedAdvance(null);
    }
  };

  const exportColumns = [
    { key: 'Data Solicitação', label: 'Data Solicitação' },
    { key: 'Contrato', label: 'Contrato' },
    { key: 'Colaborador', label: 'Colaborador' },
    { key: 'Intranet', label: 'Intranet' },
    { key: 'Valor Solicitado', label: 'Valor Solicitado' },
    { key: 'Motivo', label: 'Motivo' },
    { key: 'Data Fechamento', label: 'Data Fechamento' },
    { key: 'Valor Comprovado', label: 'Valor Comprovado' },
    { key: 'Saldo a Devolver', label: 'Saldo a Devolver' },
    { key: 'Status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = advances.map((a) => ({
      'Data Solicitação': format(new Date(a.request_date), 'dd/MM/yyyy'),
      'Contrato': getContractName(a.contract_id),
      'Colaborador': getEmployeeName(a.employee_id),
      'Intranet': a.intranet || '',
      'Valor Solicitado': a.requested_value,
      'Motivo': a.reason || '',
      'Data Fechamento': a.closing_date ? format(new Date(a.closing_date), 'dd/MM/yyyy') : '',
      'Valor Comprovado': a.proven_value || 0,
      'Saldo a Devolver': Math.max(0, (a.requested_value || 0) - (a.proven_value || 0)),
      'Status': a.status || '',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Adiantamentos');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'adiantamentos');
    else exportToCSV(data, exportColumns, 'adiantamentos');
  };

  // Normaliza variações de acentos e caixa
  const normalizeNameVariations = (name: string): string => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Busca flexível de colaborador (nomes abreviados)
  const findEmployeeFlexible = (searchName: string): string | null => {
    if (!searchName) return null;

    const normalized = normalizeNameVariations(searchName);

    // Busca exata primeiro
    const exactMatch = employees.find((e) => normalizeNameVariations(e.full_name) === normalized);
    if (exactMatch) return exactMatch.id;

    // Quebrar em partes
    const searchParts = normalized.split(/\s+/).filter((p) => p.length > 0);
    if (searchParts.length < 2) return null;

    const searchFirst = searchParts[0];
    const searchLast = searchParts[searchParts.length - 1];

    let bestMatch: { emp: typeof employees[0] | null; score: number } = { emp: null, score: 0 };

    for (const emp of employees) {
      const empNormalized = normalizeNameVariations(emp.full_name);
      const empParts = empNormalized.split(/\s+/).filter((p) => p.length > 0);
      if (empParts.length < 2) continue;

      const empFirst = empParts[0];
      let score = 0;

      // Primeiro nome deve coincidir
      if (empFirst !== searchFirst) continue;
      score += 3;

      // Último nome da busca deve estar presente
      const lastInEmp = empParts.some((p) => p === searchLast || p.startsWith(searchLast));
      if (!lastInEmp) continue;
      score += 2;

      // Nomes do meio
      if (searchParts.length > 2) {
        const searchMiddles = searchParts.slice(1, -1);
        for (const searchMid of searchMiddles) {
          const isInitial = searchMid.length === 1;
          for (const empPart of empParts.slice(1)) {
            if (isInitial) {
              if (empPart.startsWith(searchMid)) {
                score += 1;
                break;
              }
            } else if (empPart === searchMid || empPart.startsWith(searchMid)) {
              score += 1;
              break;
            }
          }
        }
      }

      if (score > bestMatch.score) {
        bestMatch = { emp, score };
      }
    }

    if (bestMatch.score >= 5 && bestMatch.emp) {
      return bestMatch.emp.id;
    }

    return null;
  };

  const handleImport = async (data: any[]) => {
    // Criar mapa de contratos por número e nome
    const contractMap = new Map<string, string>();
    contracts.forEach((c) => {
      contractMap.set(c.number.toLowerCase().trim(), c.id);
      contractMap.set(c.client_name.toLowerCase().trim(), c.id);
    });

    // Processar registros resolvendo IDs
    const processedData = data.map((row) => {
      const contractRef = row.contract_ref?.toLowerCase().trim();
      const contractId = contractRef ? contractMap.get(contractRef) : null;

      const employeeId = findEmployeeFlexible(row.employee_name);

      return {
        contract_id: contractId || null,
        employee_id: employeeId,
        intranet: row.intranet || null,
        request_date: row.request_date,
        requested_value: row.requested_value,
        reason: row.reason || null,
        closing_date: row.closing_date || null,
        proven_value: row.proven_value || 0,
        status: row.status || 'Pendente',
      };
    });

    // Filtrar registros com colaborador válido
    const validData = processedData.filter((r) => r.employee_id);
    const invalidCount = processedData.length - validData.length;

    if (validData.length === 0) {
      throw new Error('Nenhum colaborador foi encontrado. Verifique se os nomes correspondem aos cadastrados.');
    }

    const { error } = await supabase.from('advances').insert(validData);
    if (error) throw error;

    // Invalidar cache para atualizar listagem
    queryClient.invalidateQueries({ queryKey: ['advances'] });

    let message = `${validData.length} registros importados com sucesso!`;
    if (invalidCount > 0) {
      message += ` ${invalidCount} registros ignorados (colaborador não encontrado).`;
      toast.warning(message);
    } else {
      toast.success(message);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Adiantamentos"
        description="Gestão de adiantamentos salariais"
        onAdd={() => {
          setSelectedAdvance(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
        onImport={() => setImportOpen(true)}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Listagem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdvancesDashboard />
        </TabsContent>

        <TabsContent value="list">
          <DataTable
            data={advances}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Buscar por colaborador..."
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDeleteMany={deleteMany}
          />
        </TabsContent>
      </Tabs>

      <AdvanceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        advance={selectedAdvance}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Adiantamento"
        description="Tem certeza que deseja excluir este adiantamento?"
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        title="Importar Adiantamentos"
        columnMappings={advanceImportConfig.mappings}
        templateColumns={advanceImportConfig.templateColumns}
        templateFilename="template_adiantamentos"
      />
    </AppLayout>
  );
}
