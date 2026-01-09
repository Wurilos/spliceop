import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { EmployeesDashboard } from '@/components/employees/EmployeesDashboard';
import { Tables } from '@/integrations/supabase/types';
import { employeeImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Employee = Tables<'employees'> & {
  contracts?: { number: string; client_name: string } | null;
  ctps?: string | null;
  ctps_serie?: string | null;
  termination_date?: string | null;
  re?: string | null;
};

const columns: Column<Employee>[] = [
  { key: 'full_name', label: 'Nome' },
  { key: 'cpf', label: 'CPF' },
  { key: 'rg', label: 'RG' },
  { key: 'role', label: 'Cargo' },
  { key: 'phone', label: 'Telefone' },
  { key: 're', label: 'RE' },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={String(value || 'active')} />,
  },
];

const exportColumns = [
  { key: 'Nome Completo', label: 'Nome Completo' },
  { key: 'CPF', label: 'CPF' },
  { key: 'RG', label: 'RG' },
  { key: 'Email', label: 'Email' },
  { key: 'Telefone', label: 'Telefone' },
  { key: 'Cargo', label: 'Cargo' },
  { key: 'CTPS', label: 'CTPS' },
  { key: 'Série', label: 'Série' },
  { key: 'Salário', label: 'Salário' },
  { key: 'Data Admissão', label: 'Data Admissão' },
  { key: 'Data Demissão', label: 'Data Demissão' },
  { key: 'Status', label: 'Status' },
  { key: 'RE', label: 'RE' },
];

export default function Employees() {
  const { employees, loading, create, update, delete: deleteEmployee, deleteMany, isCreating, isUpdating } = useEmployees();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: Partial<Employee>) => {
    if (editingEmployee) {
      update({ id: editingEmployee.id, ...data });
    } else {
      create(data as any);
    }
    setFormOpen(false);
    setEditingEmployee(null);
  };

  const handleImport = async (rows: any[]) => {
    const mapStatus = (value: any) => {
      const v = String(value ?? '').toLowerCase().trim();
      const statusMap: Record<string, string> = {
        'ativo': 'active',
        'active': 'active',
        'inativo': 'inactive',
        'inactive': 'inactive',
        'férias': 'vacation',
        'ferias': 'vacation',
        'vacation': 'vacation',
        'desligado': 'terminated',
        'terminated': 'terminated',
      };
      return statusMap[v] || 'active';
    };

    const normalized = rows.map((row) => {
      const r: any = { ...row };

      // Alguns relatórios vêm com as colunas RE e Status invertidas.
      // Ex: re = "Ativo" e status = "4199" (número do RE).
      const statusRaw = String(r.status ?? '').trim();
      const reRaw = String(r.re ?? '').trim();
      const statusLooksNumeric = /^\d+$/.test(statusRaw);
      const reLooksLikeStatus = ['ativo', 'inativo', 'férias', 'ferias', 'desligado', 'active', 'inactive', 'vacation', 'terminated']
        .includes(reRaw.toLowerCase());

      if (statusLooksNumeric && reLooksLikeStatus) {
        r.re = statusRaw || null;
        r.status = mapStatus(reRaw);
      } else {
        r.status = mapStatus(r.status);
        r.re = r.re ? String(r.re).trim() : null;
      }

      // Garantir nulls em campos opcionais
      r.email = r.email ? String(r.email).trim() : null;
      r.termination_date = r.termination_date || null;

      return r;
    });

    const { error } = await supabase.from('employees').insert(normalized);
    if (error) throw error;
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = employees.map((e: any) => ({
      'Nome Completo': e.full_name,
      'CPF': e.cpf || '',
      'RG': e.rg || '',
      'Email': e.email || '',
      'Telefone': e.phone || '',
      'Cargo': e.role || '',
      'CTPS': e.ctps || '',
      'Série': e.ctps_serie || '',
      'Salário': e.salary ? `R$ ${Number(e.salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      'Data Admissão': e.admission_date || '',
      'Data Demissão': e.termination_date || '',
      'Status': e.status === 'active' ? 'Ativo' : e.status === 'inactive' ? 'Inativo' : e.status === 'vacation' ? 'Férias' : 'Desligado',
      'RE': e.re || '',
    }));
    if (type === 'pdf') exportToPDF(data, exportColumns, 'Colaboradores');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'colaboradores');
    else exportToCSV(data, exportColumns, 'colaboradores');
  };

  return (
    <AppLayout title="Colaboradores">
      <div className="space-y-6">
        <PageHeader
          title="Colaboradores"
          description="Gerencie a equipe técnica"
          onAdd={handleAdd}
          addLabel="Novo Colaborador"
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
        />

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="listagem">Listagem</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <EmployeesDashboard />
          </TabsContent>

          <TabsContent value="listagem">
            <DataTable
              data={employees}
              columns={columns}
              loading={loading}
              searchPlaceholder="Buscar colaboradores..."
              onEdit={handleEdit}
              onDelete={(employee) => deleteEmployee(employee.id)}
              onDeleteMany={deleteMany}
              entityName="colaborador"
            />
          </TabsContent>
        </Tabs>

        <EmployeeForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingEmployee}
          loading={isCreating || isUpdating}
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Colaboradores"
          description="Importe colaboradores a partir de uma planilha Excel"
          columnMappings={employeeImportConfig.mappings}
          templateColumns={employeeImportConfig.templateColumns}
          templateFilename="colaboradores"
          onImport={handleImport}
        />
      </div>
    </AppLayout>
  );
}
