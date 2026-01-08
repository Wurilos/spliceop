import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { Tables } from '@/integrations/supabase/types';
import { employeeImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

type Employee = Tables<'employees'> & { contracts?: { number: string; client_name: string } | null };

const columns: Column<Employee>[] = [
  { key: 'full_name', label: 'Nome' },
  { key: 'cpf', label: 'CPF' },
  { key: 'role', label: 'Cargo' },
  { key: 'department', label: 'Departamento' },
  { key: 'phone', label: 'Telefone' },
  {
    key: 'contracts.client_name',
    label: 'Contrato',
    render: (_, row) => row.contracts?.client_name || '-',
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={String(value || 'active')} />,
  },
];

const exportColumns = [
  { key: 'Nome', label: 'Nome' },
  { key: 'CPF', label: 'CPF' },
  { key: 'Cargo', label: 'Cargo' },
  { key: 'Departamento', label: 'Departamento' },
  { key: 'Telefone', label: 'Telefone' },
  { key: 'Status', label: 'Status' },
];

export default function Employees() {
  const { employees, loading, create, update, delete: deleteEmployee, isCreating, isUpdating, isDeleting } = useEmployees();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setDeletingEmployee(employee);
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

  const handleConfirmDelete = () => {
    if (deletingEmployee) {
      deleteEmployee(deletingEmployee.id);
      setDeletingEmployee(null);
    }
  };

  const handleImport = async (data: any[]) => {
    const { error } = await supabase.from('employees').insert(data);
    if (error) throw error;
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = employees.map((e) => ({
      'Nome': e.full_name,
      'CPF': e.cpf || '',
      'Cargo': e.role || '',
      'Departamento': e.department || '',
      'Telefone': e.phone || '',
      'Status': e.status || '',
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

        <DataTable
          data={employees}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar colaboradores..."
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <EmployeeForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingEmployee}
          loading={isCreating || isUpdating}
        />

        <DeleteDialog
          open={!!deletingEmployee}
          onOpenChange={(open) => !open && setDeletingEmployee(null)}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
          tableName="employees"
          recordId={deletingEmployee?.id}
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
