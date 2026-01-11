import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { TeamForm } from '@/components/teams/TeamForm';
import { useTeams } from '@/hooks/useTeams';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Teams() {
  const { teams, loading, create, update, delete: deleteTeam, isCreating, isUpdating } = useTeams();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  const columns = [
    { key: 'name', label: 'Equipe' },
    { key: 'description', label: 'Descrição' },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }),
    },
  ];

  const handleAdd = () => {
    setSelectedTeam(null);
    setFormOpen(true);
  };

  const handleEdit = (team: any) => {
    setSelectedTeam(team);
    setFormOpen(true);
  };

  const handleDelete = (team: any) => {
    setSelectedTeam(team);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTeam) {
      deleteTeam(selectedTeam.id);
      setDeleteOpen(false);
      setSelectedTeam(null);
    }
  };

  const handleSubmit = (data: any) => {
    if (selectedTeam) {
      update({ id: selectedTeam.id, ...data });
    } else {
      create(data);
    }
    setFormOpen(false);
  };

  const exportColumns = [
    { key: 'Equipe', label: 'Equipe' },
    { key: 'Descrição', label: 'Descrição' },
    { key: 'Criado em', label: 'Criado em' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = teams.map((t) => ({
      Equipe: t.name,
      Descrição: t.description || '-',
      'Criado em': format(new Date(t.created_at), 'dd/MM/yyyy'),
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Equipes');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'equipes');
    else exportToCSV(data, exportColumns, 'equipes');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Equipes"
          description="Gerencie as equipes de trabalho"
          onAdd={handleAdd}
          onExport={handleExport}
        />

        <DataTable
          data={teams}
          columns={columns}
          loading={loading}
          searchPlaceholder="Buscar equipe..."
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <TeamForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          initialData={selectedTeam}
          loading={isCreating || isUpdating}
        />

        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={confirmDelete}
          title="Excluir Equipe"
          description="Tem certeza que deseja excluir esta equipe? Os colaboradores associados perderão o vínculo."
        />
      </div>
    </AppLayout>
  );
}
