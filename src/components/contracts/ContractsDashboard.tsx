import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContracts } from '@/hooks/useContracts';
import { useInvoices } from '@/hooks/useInvoices';
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
import { FileText, AlertTriangle, CheckCircle, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { differenceInMonths, differenceInDays, format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  inactive: '#6b7280',
  expired: '#ef4444',
  pending: '#f59e0b',
};

export function ContractsDashboard() {
  const { contracts, loading } = useContracts();
  const { invoices } = useInvoices();

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  const today = new Date();

  // Stats calculations
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((c) => c.status === 'active').length;
  
  // Contracts expiring in next 90 days
  const expiringContracts = contracts.filter((c) => {
    if (!c.end_date) return false;
    const endDate = new Date(c.end_date);
    const daysUntilExpiry = differenceInDays(endDate, today);
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
  });

  // Total contract value
  const totalValue = contracts.reduce((acc, c) => acc + (Number(c.value) || 0), 0);

  // Total invoiced
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (Number(inv.value) || 0), 0);

  // Status distribution
  const statusData = contracts.reduce((acc, c) => {
    const status = c.status || 'active';
    const existing = acc.find((item) => item.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Contracts by state
  const stateData = contracts.reduce((acc, c) => {
    const state = c.state || 'Não informado';
    const existing = acc.find((item) => item.name === state);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: state, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  // Expiration timeline (next 12 months)
  const expirationTimeline = Array.from({ length: 12 }, (_, i) => {
    const monthStart = addMonths(today, i);
    const monthEnd = addMonths(today, i + 1);
    const count = contracts.filter((c) => {
      if (!c.end_date) return false;
      const endDate = new Date(c.end_date);
      return endDate >= monthStart && endDate < monthEnd;
    }).length;
    return {
      month: format(monthStart, 'MMM/yy', { locale: ptBR }),
      quantidade: count,
    };
  });

  // Top contracts by value
  const topContractsByValue = [...contracts]
    .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
    .slice(0, 5)
    .map((c) => ({
      name: c.client_name.length > 15 ? c.client_name.substring(0, 15) + '...' : c.client_name,
      valor: Number(c.value) || 0,
    }));

  // Revenue by contract (from invoices)
  const revenueByContract = contracts
    .map((contract) => {
      const contractInvoices = invoices.filter((inv) => inv.contract_id === contract.id);
      const totalRevenue = contractInvoices.reduce((acc, inv) => acc + (Number(inv.value) || 0), 0);
      return {
        name: contract.client_name.length > 12 ? contract.client_name.substring(0, 12) + '...' : contract.client_name,
        faturado: totalRevenue,
      };
    })
    .filter((c) => c.faturado > 0)
    .sort((a, b) => b.faturado - a.faturado)
    .slice(0, 6);

  // Contracts by city
  const cityData = contracts.reduce((acc, c) => {
    const city = c.city || 'Não informado';
    const existing = acc.find((item) => item.name === city);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: city, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      expired: 'Expirado',
      pending: 'Pendente',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeContracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 90 dias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringContracts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Contratos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{formatCurrency(totalInvoiced)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Contrato</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrency(totalContracts > 0 ? totalValue / totalContracts : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vencimentos nos Próximos 12 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expirationTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#f59e0b" name="Contratos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${getStatusLabel(name)}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, getStatusLabel(String(name))]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Contratos por Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topContractsByValue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="valor" fill="#3b82f6" name="Valor" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento por Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByContract} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="faturado" fill="#10b981" name="Faturado" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" name="Contratos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos por Cidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={cityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {cityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Contracts List */}
      {expiringContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Contratos Vencendo em até 90 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringContracts.map((contract) => {
                const daysLeft = differenceInDays(new Date(contract.end_date!), today);
                return (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                  >
                    <div>
                      <p className="font-medium">{contract.client_name}</p>
                      <p className="text-sm text-muted-foreground">Contrato: {contract.number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-600">
                        {daysLeft === 0 ? 'Vence hoje' : `${daysLeft} dias restantes`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(contract.end_date!), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
