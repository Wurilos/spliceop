import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, Download, Eye, Activity } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AuditLogsTab() {
  const { auditLogs, isLoading } = useAuditLog();
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<typeof auditLogs[0] | null>(null);

  const uniqueTables = useMemo(() => {
    const tables = new Set(auditLogs.map((log) => log.table_name));
    return Array.from(tables).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (tableFilter !== 'all' && log.table_name !== tableFilter) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (userIdFilter && !log.user_id?.includes(userIdFilter)) return false;
      return true;
    });
  }, [auditLogs, tableFilter, actionFilter, userIdFilter]);

  const stats = useMemo(() => {
    const creates = filteredLogs.filter((l) => l.action === 'INSERT').length;
    const updates = filteredLogs.filter((l) => l.action === 'UPDATE').length;
    const deletes = filteredLogs.filter((l) => l.action === 'DELETE').length;
    return { total: filteredLogs.length, creates, updates, deletes };
  }, [filteredLogs]);

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      INSERT: 'bg-emerald-500 hover:bg-emerald-600',
      UPDATE: 'bg-blue-500 hover:bg-blue-600',
      DELETE: 'bg-destructive hover:bg-destructive/90',
    };
    const labels: Record<string, string> = {
      INSERT: 'CREATE',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
    };
    return (
      <Badge className={styles[action] || 'bg-muted'}>
        {labels[action] || action}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Tabela', 'Ação', 'Registro'];
    const rows = filteredLogs.map((log) => [
      log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss') : '',
      log.user_id || 'unknown',
      log.table_name,
      log.action,
      log.record_id || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tabela</label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as tabelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tabelas</SelectItem>
                  {uniqueTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="INSERT">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Usuário ID</label>
              <Input
                placeholder="ID do usuário"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Criações</p>
                <p className="text-2xl font-bold text-emerald-500">{stats.creates}</p>
              </div>
              <span className="text-emerald-500 text-xl">+</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atualizações</p>
                <p className="text-2xl font-bold text-blue-500">{stats.updates}</p>
              </div>
              <span className="text-blue-500 text-xl">~</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exclusões</p>
                <p className="text-2xl font-bold text-destructive">{stats.deletes}</p>
              </div>
              <span className="text-destructive text-xl">-</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">
            Logs de Auditoria ({filteredLogs.length} registros)
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Campos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum log encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.slice(0, 100).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.created_at
                      ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.user_id?.slice(0, 8) || '-'}...
                  </TableCell>
                  <TableCell className="font-medium">{log.table_name}</TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.record_id ? `${log.record_id.slice(0, 8)}...` : 'unknown'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Tabela</label>
                  <p className="font-medium">{selectedLog.table_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Ação</label>
                  <p>{getActionBadge(selectedLog.action)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Data/Hora</label>
                  <p>
                    {selectedLog.created_at
                      ? format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", {
                          locale: ptBR,
                        })
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Usuário ID</label>
                  <p className="font-mono text-sm">{selectedLog.user_id || '-'}</p>
                </div>
              </div>

              {selectedLog.old_data && (
                <div>
                  <label className="text-sm text-muted-foreground">Dados Anteriores</label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <label className="text-sm text-muted-foreground">Dados Novos</label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
