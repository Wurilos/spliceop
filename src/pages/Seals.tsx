import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { SealForm } from '@/components/seals/SealForm';
import { useSeals } from '@/hooks/useSeals';
import { useEquipment } from '@/hooks/useEquipment';
import { useEmployees } from '@/hooks/useEmployees';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function Seals() {
  const { seals, isLoading, deleteSeal } = useSeals();
  const { equipment } = useEquipment();
  const { employees } = useEmployees();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSeal, setSelectedSeal] = useState<any>(null);

  const getEquipmentSerial = (equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId);
    return eq?.serial_number || '-';
  };

  const getTechnicianName = (technicianId: string | null) => {
    if (!technicianId) return '-';
    const tech = employees.find((e) => e.id === technicianId);
    return tech?.full_name || '-';
  };

  const columns = [
    { key: 'seal_number', label: 'Número do Lacre' },
    {
      key: 'equipment_id',
      label: 'Equipamento',
      render: (value: string) => getEquipmentSerial(value),
    },
    {
      key: 'installation_date',
      label: 'Data Instalação',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }),
    },
    { key: 'service_order', label: 'Ordem de Serviço' },
    {
      key: 'technician_id',
      label: 'Técnico',
      render: (value: string | null) => getTechnicianName(value),
    },
  ];

  const handleEdit = (seal: any) => {
    setSelectedSeal(seal);
    setFormOpen(true);
  };

  const handleDelete = (seal: any) => {
    setSelectedSeal(seal);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSeal) {
      deleteSeal(selectedSeal.id);
      setDeleteOpen(false);
      setSelectedSeal(null);
    }
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = seals.map((s) => ({
      'Número do Lacre': s.seal_number,
      Equipamento: getEquipmentSerial(s.equipment_id),
      'Data Instalação': format(new Date(s.installation_date), 'dd/MM/yyyy'),
      'Ordem de Serviço': s.service_order || '',
      Técnico: getTechnicianName(s.technician_id),
    }));

    if (type === 'pdf') exportToPDF(data, 'Lacres e OS');
    else if (type === 'excel') exportToExcel(data, 'lacres');
    else exportToCSV(data, 'lacres');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Lacres e OS"
        description="Gestão de lacres e ordens de serviço"
        onAdd={() => {
          setSelectedSeal(null);
          setFormOpen(true);
        }}
        onExport={handleExport}
      />

      <DataTable
        data={seals}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por número do lacre..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        seal={selectedSeal}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Excluir Lacre"
        description="Tem certeza que deseja excluir este lacre?"
      />
    </AppLayout>
  );
}
