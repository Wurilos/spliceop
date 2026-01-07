import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { IssueForm } from '@/components/issues/IssueForm';
import { usePendingIssues } from '@/hooks/usePendingIssues';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { Badge } from '@/components/ui/badge';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Issues() {
  const { pendingIssues, isLoading, deletePendingIssue } = usePendingIssues();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  const getContractName = (contractId: string | null) => {
    if (!contractId) return '-';
    const contract = contracts.find((c) => c.id === contractId);
    return contract?.client_name || '-';
  };

  const getEquipmentSerial = (equipmentId: string | null) => {
    if (!equipmentId) return '-';
    const eq = equipment.find((e) => e.id === equipmentId);
    return eq?.serial_number || '-';
  };

  const getPriorityBadge = (priority: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return (
      <Badge variant={variants[priority || 'medium'] || 'default'}>
        {priority === 'high' ? 'Alta' : priority === 'low' ? 'Baixa' : 'Média'}
      </Badge>
    );
  };

  const columns = [
    { key: 'title', label: 'Título' },
    {
      key: 'priority',
      label: 'Prioridade',
      render: (value: string | null) => getPriorityBadge(value),
    },
    {
      key: 'contract_id',
      label: 'Contrato',
      render: (value: string | null) => getContractName(value),
    },
    {
      key: 'equipment_id',
      label: 'Equipamento',
      render: (value: string | null) => getEquipmentSerial(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value: string | null) =>
        value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : '-',
    },
  ];

  const handleEdit = (issue: any) => {
    setSelectedIssue(issue);
    setFormOpen(true);
  };

  const handleDelete = (issue: any) => {
    setSelectedIssue(issue);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedIssue) {
      deletePendingIssue(selectedIssue.id);
      setDeleteOpen(false);
      setSelectedIssue(null);
    }
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = pendingIssues.map((i) => ({
      Título: i.title,
      Prioridade: i.priority || 'medium',
      Contrato: getContractName(i.contract_id),
      Equipamento: getEquipmentSerial(i.equipment_id),
      Status: i.status || '',
      'Criado em': i.created_at ? format(new Date(i.created_at), 'dd/MM/yyyy') : '',
    }));

    if (type === 'pdf') exportToPDF(data, 'Pendências');
    else if (type === 'excel') exportToExcel(data, 'pendencias');
    else exportToCSV(data, 'pendencias');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Pendências"
        description="Gestão de pendências e problemas"
        onAdd={() => {
          setSelectedIssue(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={pendingIssues}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por título..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <IssueForm
        open={formOpen}
        onOpenChange={setFormOpen}
        issue={selectedIssue}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Pendência"
        description="Tem certeza que deseja excluir esta pendência?"
      />
    </AppLayout>
  );
}
