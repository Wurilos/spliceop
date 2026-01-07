import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { GoalForm } from '@/components/goals/GoalForm';
import { useServiceGoals } from '@/hooks/useServiceGoals';
import { useContracts } from '@/hooks/useContracts';
import { Progress } from '@/components/ui/progress';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Goals() {
  const { serviceGoals, isLoading, deleteServiceGoal } = useServiceGoals();
  const { contracts } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const getContractName = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    return contract?.client_name || '-';
  };

  const columns = [
    {
      key: 'contract_id',
      label: 'Contrato',
      render: (value: string) => getContractName(value),
    },
    {
      key: 'month',
      label: 'Mês',
      render: (value: string) => format(new Date(value), 'MM/yyyy', { locale: ptBR }),
    },
    { key: 'target_calls', label: 'Meta' },
    { key: 'completed_calls', label: 'Realizados' },
    {
      key: 'percentage',
      label: 'Progresso',
      render: (value: number | null, row: any) => {
        const pct = value || (row.target_calls > 0 ? (row.completed_calls / row.target_calls) * 100 : 0);
        return (
          <div className="flex items-center gap-2">
            <Progress value={pct} className="w-20 h-2" />
            <span className="text-sm">{pct.toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  const handleEdit = (goal: any) => {
    setSelectedGoal(goal);
    setFormOpen(true);
  };

  const handleDelete = (goal: any) => {
    setSelectedGoal(goal);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedGoal) {
      deleteServiceGoal(selectedGoal.id);
      setDeleteOpen(false);
      setSelectedGoal(null);
    }
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = serviceGoals.map((g) => ({
      Contrato: getContractName(g.contract_id),
      Mês: format(new Date(g.month), 'MM/yyyy'),
      Meta: g.target_calls || 0,
      Realizados: g.completed_calls || 0,
      'Progresso (%)': g.percentage || 0,
    }));

    if (type === 'pdf') exportToPDF(data, 'Metas de Atendimento');
    else if (type === 'excel') exportToExcel(data, 'metas');
    else exportToCSV(data, 'metas');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Metas"
        description="Metas de atendimento por contrato"
        onAdd={() => {
          setSelectedGoal(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={serviceGoals}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por contrato..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <GoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        goal={selectedGoal}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Meta"
        description="Tem certeza que deseja excluir esta meta?"
      />
    </AppLayout>
  );
}
