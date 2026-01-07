import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { Tables } from '@/integrations/supabase/types';

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

export default function Employees() {
  const { employees, loading, create, update, delete: deleteEmployee, isCreating, isUpdating, isDeleting } = useEmployees();
  const [formOpen, setFormOpen] = useState(false);
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

  return (
    <AppLayout title="Colaboradores">
      <div className="space-y-6">
        <PageHeader
          title="Colaboradores"
          description="Gerencie a equipe técnica"
          onAdd={handleAdd}
          addLabel="Novo Colaborador"
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
        />
      </div>
    </AppLayout>
  );
}
