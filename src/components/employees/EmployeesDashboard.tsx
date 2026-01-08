import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEmployees } from '@/hooks/useEmployees';
import { Users, DollarSign, Briefcase, Activity } from 'lucide-react';
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
  Legend,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  inactive: '#6b7280',
  vacation: '#eab308',
  terminated: '#ef4444',
};

const CHART_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    vacation: 'Férias',
    terminated: 'Desligado',
  };
  return labels[status] || status;
};

export function EmployeesDashboard() {
  const { employees, loading } = useEmployees();

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  // Stats calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const averageSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
  const uniqueRoles = new Set(employees.map((e) => e.role).filter(Boolean)).size;
  const activityRate = totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 0;

  // Salary analysis by role
  const salaryByRole = employees.reduce((acc, emp) => {
    const role = emp.role || 'Não definido';
    if (!acc[role]) {
      acc[role] = { total: 0, count: 0, salaries: [] as number[] };
    }
    acc[role].total += emp.salary || 0;
    acc[role].count += 1;
    acc[role].salaries.push(emp.salary || 0);
    return acc;
  }, {} as Record<string, { total: number; count: number; salaries: number[] }>);

  const salaryChartData = Object.entries(salaryByRole)
    .map(([role, data]) => ({
      role,
      media: data.count > 0 ? data.total / data.count : 0,
    }))
    .sort((a, b) => b.media - a.media)
    .slice(0, 8);

  // Status distribution
  const statusData = employees.reduce((acc, emp) => {
    const status = emp.status || 'active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: getStatusLabel(status),
    value: count,
    color: STATUS_COLORS[status] || '#8b5cf6',
  }));

  // Top 5 roles
  const top5Roles = Object.entries(salaryByRole)
    .map(([role, data]) => ({ role, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Detailed salary table data
  const detailedSalaryData = Object.entries(salaryByRole)
    .map(([role, data]) => ({
      role,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0,
      min: data.salaries.length > 0 ? Math.min(...data.salaries) : 0,
      max: data.salaries.length > 0 ? Math.max(...data.salaries) : 0,
    }))
    .sort((a, b) => b.average - a.average);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{activeEmployees} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Salarial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageSalary)}</div>
            <p className="text-xs text-muted-foreground">por colaborador</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folha Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">total mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cargos Únicos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueRoles}</div>
            <p className="text-xs text-muted-foreground">diferentes funções</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Atividade</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">colaboradores ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Salary by Role Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Análise Salarial por Cargo</CardTitle>
          <CardDescription>Média salarial por função</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="role"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Média']}
                  labelFormatter={(label) => `Cargo: ${label}`}
                />
                <Bar dataKey="media" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status and Top Roles Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-primary">Status dos Colaboradores</CardTitle>
            <CardDescription>Distribuição por situação atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-primary">Top 5 Cargos</CardTitle>
            <CardDescription>Cargos com mais colaboradores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top5Roles} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="role"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Quantidade']}
                    labelFormatter={(label) => `Cargo: ${label}`}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-primary">Análise Salarial Detalhada</CardTitle>
          <CardDescription>Estatísticas salariais por cargo</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Média</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Máximo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailedSalaryData.map((row) => (
                <TableRow key={row.role}>
                  <TableCell className="font-medium text-primary">{row.role}</TableCell>
                  <TableCell className="text-center">{row.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.average)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(row.min)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(row.max)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
