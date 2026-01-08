import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/hooks/useInvoices';
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
} from 'recharts';
import { FileText, DollarSign, TrendingUp, TrendingDown, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const STATUS_COLORS: Record<string, string> = {
  paid: '#10b981',
  pending: '#f59e0b',
  overdue: '#ef4444',
  cancelled: '#6b7280',
};

export function InvoicingDashboard() {
  const { invoices, loading } = useInvoices();
  const { contracts } = useContracts();

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Stats calculations
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.monthly_value) || Number(inv.value) || 0), 0);
  const totalContractValue = invoices.reduce((acc, inv) => acc + (Number(inv.value) || 0), 0);
  
  // Discounts and surcharges
  const totalDiscounts = invoices.reduce((acc, inv) => {
    const discount = Number(inv.discount) || 0;
    return discount < 0 ? acc + Math.abs(discount) : acc;
  }, 0);
  
  const totalSurcharges = invoices.reduce((acc, inv) => {
    const discount = Number(inv.discount) || 0;
    return discount > 0 ? acc + discount : acc;
  }, 0);

  // Status counts
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
  const pendingCount = invoices.filter((inv) => inv.status === 'pending').length;
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  // Revenue by month (last 12 months)
  const today = new Date();
  const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
    const monthDate = subMonths(startOfMonth(today), 11 - i);
    const monthStr = format(monthDate, 'yyyy-MM');
    
    const monthInvoices = invoices.filter((inv) => {
      const issueDate = inv.issue_date ? format(parseISO(inv.issue_date), 'yyyy-MM') : '';
      return issueDate === monthStr;
    });
    
    const revenue = monthInvoices.reduce((acc, inv) => acc + (Number(inv.monthly_value) || Number(inv.value) || 0), 0);
    
    return {
      month: format(monthDate, 'MMM/yy', { locale: ptBR }),
      receita: revenue,
    };
  });

  // Discounts/Surcharges by month
  const discountsByMonth = Array.from({ length: 12 }, (_, i) => {
    const monthDate = subMonths(startOfMonth(today), 11 - i);
    const monthStr = format(monthDate, 'yyyy-MM');
    
    const monthInvoices = invoices.filter((inv) => {
      const issueDate = inv.issue_date ? format(parseISO(inv.issue_date), 'yyyy-MM') : '';
      return issueDate === monthStr;
    });
    
    const discounts = monthInvoices.reduce((acc, inv) => {
      const discount = Number(inv.discount) || 0;
      return discount < 0 ? acc + Math.abs(discount) : acc;
    }, 0);
    
    const surcharges = monthInvoices.reduce((acc, inv) => {
      const discount = Number(inv.discount) || 0;
      return discount > 0 ? acc + discount : acc;
    }, 0);
    
    return {
      month: format(monthDate, 'MMM/yy', { locale: ptBR }),
      descontos: discounts,
      acrescimos: surcharges,
    };
  });

  // Status distribution
  const statusData = invoices.reduce((acc, inv) => {
    const status = inv.status || 'pending';
    const existing = acc.find((item) => item.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Revenue by contract
  const revenueByContract = contracts
    .map((contract) => {
      const contractInvoices = invoices.filter((inv) => inv.contract_id === contract.id);
      const totalRevenue = contractInvoices.reduce((acc, inv) => acc + (Number(inv.monthly_value) || Number(inv.value) || 0), 0);
      const invoiceCount = contractInvoices.length;
      return {
        name: contract.client_name.length > 15 ? contract.client_name.substring(0, 15) + '...' : contract.client_name,
        fullName: contract.client_name,
        receita: totalRevenue,
        quantidade: invoiceCount,
      };
    })
    .filter((c) => c.receita > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 8);

  // Average ticket
  const averageTicket = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Vencido',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(averageTicket)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Descontos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">-{formatCurrency(totalDiscounts)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Acréscimos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">+{formatCurrency(totalSurcharges)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} pendentes, {overdueCount} vencidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 - Revenue by Month */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="receita" fill="#10b981" name="Receita" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descontos e Acréscimos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={discountsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="descontos" fill="#ef4444" name="Descontos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="acrescimos" fill="#10b981" name="Acréscimos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Status and Contract Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status de Pagamentos</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita por Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByContract} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(Number(value)), name === 'receita' ? 'Receita' : name]}
                  labelFormatter={(label) => {
                    const item = revenueByContract.find(c => c.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Bar dataKey="receita" fill="#3b82f6" name="Receita" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Notas Pagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            <p className="text-sm text-muted-foreground">
              {totalInvoices > 0 ? ((paidCount / totalInvoices) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Notas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">
              {totalInvoices > 0 ? ((pendingCount / totalInvoices) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Notas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-sm text-muted-foreground">
              {totalInvoices > 0 ? ((overdueCount / totalInvoices) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
