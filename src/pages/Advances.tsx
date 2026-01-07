import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { AdvanceForm } from '@/components/advances/AdvanceForm';
import { useAdvances } from '@/hooks/useAdvances';
import { useEmployees } from '@/hooks/useEmployees';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Advances() {
  const { advances, isLoading, deleteAdvance } = useAdvances();
  const { employees } = useEmployees();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.full_name || '-';
  };

  const columns = [
    {
      key: 'date',
      label: 'Data',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'employee_id',
      label: 'Colaborador',
      render: (value: string) => getEmployeeName(value),
    },
    {
      key: 'value',
      label: 'Valor',
      render: (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    { key: 'reason', label: 'Motivo' },
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
    { key: 'Data', label: 'Data' },
    { key: 'Colaborador', label: 'Colaborador' },
    { key: 'Valor', label: 'Valor' },
    { key: 'Motivo', label: 'Motivo' },
    { key: 'Status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = advances.map((a) => ({
      Data: format(new Date(a.date), 'dd/MM/yyyy'),
      Colaborador: getEmployeeName(a.employee_id),
      Valor: a.value,
      Motivo: a.reason || '',
      Status: a.status || '',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Adiantamentos');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'adiantamentos');
    else exportToCSV(data, exportColumns, 'adiantamentos');
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
      />

      <DataTable
        data={advances}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por colaborador..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

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
    </AppLayout>
  );
}
