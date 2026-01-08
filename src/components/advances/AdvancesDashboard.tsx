import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  X,
  Users
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAdvances } from '@/hooks/useAdvances';
import { useEmployees } from '@/hooks/useEmployees';
import { useContracts } from '@/hooks/useContracts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  paid: 'Pago',
};

const statusColors: Record<string, string> = {
  pending: '#eab308',
  approved: '#22c55e',
  rejected: '#ef4444',
  paid: '#3b82f6',
};

export function AdvancesDashboard() {
  const { advances, isLoading } = useAdvances();
  const { employees } = useEmployees();
  const { contracts } = useContracts();
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const clearFilters = () => {
    setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    setSelectedContract('all');
    setSelectedEmployee('all');
    setSelectedStatus('all');
  };

  const filteredAdvances = useMemo(() => {
    return advances.filter(advance => {
      const advanceDate = parseISO(advance.date);
      const inDateRange = isWithinInterval(advanceDate, { start: dateRange.from, end: dateRange.to });
      
      const matchesEmployee = selectedEmployee === 'all' || advance.employee_id === selectedEmployee;
      const matchesStatus = selectedStatus === 'all' || advance.status === selectedStatus;
      
      // Filter by contract through employee
      let matchesContract = selectedContract === 'all';
      if (selectedContract !== 'all') {
        const employee = employees.find(e => e.id === advance.employee_id);
        matchesContract = employee?.contract_id === selectedContract;
      }

      return inDateRange && matchesEmployee && matchesStatus && matchesContract;
    });
  }, [advances, dateRange, selectedEmployee, selectedStatus, selectedContract, employees]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredAdvances.length;
    const totalValue = filteredAdvances.reduce((sum, a) => sum + a.value, 0);
    const approvedValue = filteredAdvances
      .filter(a => a.status === 'approved' || a.status === 'paid')
      .reduce((sum, a) => sum + a.value, 0);
    const pendingValue = filteredAdvances
      .filter(a => a.status === 'pending')
      .reduce((sum, a) => sum + a.value, 0);
    
    const uniqueContracts = new Set(
      filteredAdvances.map(a => {
        const emp = employees.find(e => e.id === a.employee_id);
        return emp?.contract_id;
      }).filter(Boolean)
    ).size;

    return { total, totalValue, approvedValue, pendingValue, uniqueContracts };
  }, [filteredAdvances, employees]);

  // Get contract name for display
  const getContractName = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    return contract ? `${contract.number} - ${contract.client_name}` : contractId;
  };

  // Chart: Advances over time
  const timeChartData = useMemo(() => {
    const grouped: Record<string, { date: string; count: number; value: number }> = {};
    
    filteredAdvances.forEach(advance => {
      const dateKey = format(parseISO(advance.date), 'dd/MM');
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, count: 0, value: 0 };
      }
      grouped[dateKey].count += 1;
      grouped[dateKey].value += advance.value;
    });

    return Object.values(grouped).sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });
  }, [filteredAdvances]);

  // Chart: By status
  const statusChartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    filteredAdvances.forEach(advance => {
      const status = advance.status || 'pending';
      grouped[status] = (grouped[status] || 0) + 1;
    });

    return Object.entries(grouped).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: statusColors[status] || '#6b7280',
    }));
  }, [filteredAdvances]);

  // Chart: By employee
  const employeeChartData = useMemo(() => {
    const grouped: Record<string, { name: string; count: number; value: number }> = {};
    
    filteredAdvances.forEach(advance => {
      const employee = employees.find(e => e.id === advance.employee_id);
      const name = employee?.full_name || 'Desconhecido';
      
      if (!grouped[advance.employee_id]) {
        grouped[advance.employee_id] = { name, count: 0, value: 0 };
      }
      grouped[advance.employee_id].count += 1;
      grouped[advance.employee_id].value += advance.value;
    });

    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredAdvances, employees]);

  const hasActiveFilters = selectedContract !== 'all' || selectedEmployee !== 'all' || selectedStatus !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    locale={ptBR}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Contract */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Contrato</label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os contratos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os contratos</SelectItem>
                  {contracts.map(contract => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.number} - {contract.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Colaborador</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os colaboradores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os colaboradores</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Ação</label>
              <Button variant="outline" className="w-full" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Adiantamentos</p>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{stats.uniqueContracts} contratos</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total Solicitado</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-muted-foreground">Total solicitado</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Comprovado</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.approvedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-muted-foreground">Total comprovado</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Pendente</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.pendingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-muted-foreground">Saldo a comprovar</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Advances over time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Adiantamentos por Data de Solicitação
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Quantidade e valor dos adiantamentos ao longo do tempo
            </p>
          </CardHeader>
          <CardContent>
            {timeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'value' 
                        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : value,
                      name === 'value' ? 'Valor' : 'Quantidade'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Quantidade" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Valor" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5" />
              Adiantamentos por Status
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribuição dos adiantamentos por status atual
            </p>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By Employee */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Adiantamentos por Colaborador
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Top colaboradores com mais adiantamentos solicitados
          </p>
        </CardHeader>
        <CardContent>
          {employeeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  width={150}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'value' 
                      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : value,
                    name === 'value' ? 'Valor Total' : 'Quantidade'
                  ]}
                />
                <Legend />
                <Bar dataKey="count" name="Quantidade" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado para exibir
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applied Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros Aplicados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-primary border-primary">
              Período: {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
            </Badge>
            {selectedContract !== 'all' && (
              <Badge variant="outline">
                Contrato: {getContractName(selectedContract)}
              </Badge>
            )}
            {selectedEmployee !== 'all' && (
              <Badge variant="outline">
                Colaborador: {employees.find(e => e.id === selectedEmployee)?.full_name || selectedEmployee}
              </Badge>
            )}
            {selectedStatus !== 'all' && (
              <Badge variant="outline">
                Status: {statusLabels[selectedStatus] || selectedStatus}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
