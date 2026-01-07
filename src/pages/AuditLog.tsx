import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Badge } from '@/components/ui/badge';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';

export default function AuditLog() {
  const { auditLogs, isLoading } = useAuditLog();

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      INSERT: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
    };
    return (
      <Badge variant={variants[action] || 'outline'}>
        {action}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Data/Hora',
      render: (value: string | null) =>
        value ? format(new Date(value), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : '-',
    },
    {
      key: 'action',
      label: 'Ação',
      render: (value: string) => getActionBadge(value),
    },
    { key: 'table_name', label: 'Tabela' },
    {
      key: 'record_id',
      label: 'ID Registro',
      render: (value: string | null) => value?.slice(0, 8) || '-',
    },
    {
      key: 'user_id',
      label: 'Usuário',
      render: (value: string | null) => value?.slice(0, 8) || 'Sistema',
    },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = auditLogs.map((log) => ({
      'Data/Hora': log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss') : '',
      Ação: log.action,
      Tabela: log.table_name,
      'ID Registro': log.record_id || '',
      Usuário: log.user_id || 'Sistema',
    }));

    if (type === 'pdf') exportToPDF(data, 'Audit Log');
    else if (type === 'excel') exportToExcel(data, 'audit_log');
    else exportToCSV(data, 'audit_log');
  };

  return (
    <AppLayout>
      <PageHeader
        title="Audit Log"
        description="Histórico de alterações no sistema"
        onExport={handleExport}
      />

      <DataTable
        data={auditLogs}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar por tabela ou ação..."
      />
    </AppLayout>
  );
}
