import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { Package, CheckCircle, AlertTriangle, TrendingUp, FileText, Zap } from 'lucide-react';
import { Seal } from '@/hooks/useSeals';
import { SealServiceOrder } from '@/hooks/useSealServiceOrders';

interface SealsDashboardProps {
  seals: Seal[];
  serviceOrders: SealServiceOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  available: 'hsl(142, 76%, 36%)',
  installed: 'hsl(217, 91%, 60%)',
  lost: 'hsl(0, 84%, 60%)',
  damaged: 'hsl(38, 92%, 50%)',
};

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 67%, 60%)',
  'hsl(180, 70%, 45%)',
];

const INSTALLATION_ITEMS = [
  'MET',
  'MET - Acrílico frontal',
  'NMET',
  'MCA',
  'Cartão SD',
  'Câmeras',
  'Laço 1',
  'Laço 2',
  'Laço 3',
  'Laço 4',
];

export function SealsDashboard({ seals, serviceOrders }: SealsDashboardProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const total = seals.length;
    const available = seals.filter(s => s.status === 'available').length;
    const installed = seals.filter(s => s.status === 'installed').length;
    const lost = seals.filter(s => s.status === 'lost').length;
    const damaged = seals.filter(s => s.status === 'damaged').length;
    const utilizationRate = total > 0 ? ((installed / total) * 100).toFixed(1) : '0.0';

    return { total, available, installed, lost, damaged, utilizationRate };
  }, [seals]);

  // Data for pie chart - Distribution by Status
  const statusDistribution = useMemo(() => {
    return [
      { name: 'Disponível', value: stats.available, color: STATUS_COLORS.available },
      { name: 'Instalado', value: stats.installed, color: STATUS_COLORS.installed },
      { name: 'Perdido', value: stats.lost, color: STATUS_COLORS.lost },
      { name: 'Danificado', value: stats.damaged, color: STATUS_COLORS.damaged },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Data for bar chart - Seals by Type (Used vs Available)
  const sealsByType = useMemo(() => {
    const typeMap: Record<string, { available: number; installed: number }> = {};

    seals.forEach(seal => {
      const type = seal.seal_type || 'Sem tipo';
      if (!typeMap[type]) {
        typeMap[type] = { available: 0, installed: 0 };
      }
      if (seal.status === 'available') {
        typeMap[type].available++;
      } else if (seal.status === 'installed') {
        typeMap[type].installed++;
      }
    });

    return Object.entries(typeMap).map(([type, counts]) => ({
      type,
      disponivel: counts.available,
      instalado: counts.installed,
    }));
  }, [seals]);

  // Data for area chart - Monthly Evolution
  const monthlyEvolution = useMemo(() => {
    const months: Record<string, { recebidos: number; instalados: number }> = {};

    seals.forEach(seal => {
      if (seal.received_date) {
        const month = seal.received_date.substring(0, 7);
        if (!months[month]) {
          months[month] = { recebidos: 0, instalados: 0 };
        }
        months[month].recebidos++;
      }
      if (seal.installation_date && seal.status === 'installed') {
        const month = seal.installation_date.substring(0, 7);
        if (!months[month]) {
          months[month] = { recebidos: 0, instalados: 0 };
        }
        months[month].instalados++;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        ...data,
      }));
  }, [seals]);

  // Service Orders Statistics
  const orderStats = useMemo(() => {
    const totalOrders = serviceOrders.length;
    const openOrders = serviceOrders.filter(o => o.status === 'open').length;
    const closedOrders = serviceOrders.filter(o => o.status === 'closed').length;

    // Count installation items
    const itemCounts: Record<string, number> = {};
    serviceOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const itemName = item.installation_item;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
        });
      }
    });

    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const sealsPerOrder = totalOrders > 0 
      ? (serviceOrders.reduce((acc, order) => acc + (order.items?.length || 0), 0) / totalOrders).toFixed(1)
      : '0.0';

    return { totalOrders, openOrders, closedOrders, topItems, sealsPerOrder };
  }, [serviceOrders]);

  // Detailed analysis by seal type
  const typeAnalysis = useMemo(() => {
    const typeMap: Record<string, { total: number; available: number; installed: number }> = {};

    seals.forEach(seal => {
      const type = seal.seal_type || 'Sem tipo';
      if (!typeMap[type]) {
        typeMap[type] = { total: 0, available: 0, installed: 0 };
      }
      typeMap[type].total++;
      if (seal.status === 'available') {
        typeMap[type].available++;
      } else if (seal.status === 'installed') {
        typeMap[type].installed++;
      }
    });

    return Object.entries(typeMap).map(([type, data]) => ({
      type,
      ...data,
      utilizationRate: data.total > 0 ? ((data.installed / data.total) * 100).toFixed(1) : '0.0',
    }));
  }, [seals]);

  const chartConfig = {
    disponivel: { label: 'Disponível', color: 'hsl(142, 76%, 36%)' },
    instalado: { label: 'Instalado', color: 'hsl(217, 91%, 60%)' },
    recebidos: { label: 'Recebidos', color: 'hsl(142, 76%, 36%)' },
    instalados: { label: 'Instalados', color: 'hsl(217, 91%, 60%)' },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Total de Lacres</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Lacres no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Lacres Disponíveis</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">Prontos para uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Lacres Instalados</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.installed}</div>
            <p className="text-xs text-muted-foreground">Em uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Taxa de Utilização</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">Lacres utilizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar Chart - Seals by Type */}
        <Card>
          <CardHeader>
            <CardTitle translate="no">Lacres por Tipo - Utilizados vs Disponíveis</CardTitle>
            <CardDescription>Comparação entre lacres instalados e disponíveis por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={sealsByType} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={80} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="disponivel" name="Disponível" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="instalado" name="Instalado" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Distribution by Status */}
        <Card>
          <CardHeader>
            <CardTitle translate="no">Distribuição de Lacres por Status</CardTitle>
            <CardDescription>Status atual de todos os lacres</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Area Chart - Monthly Evolution */}
        <Card>
          <CardHeader>
            <CardTitle translate="no">Evolução Mensal de Lacres</CardTitle>
            <CardDescription>Recebimento e instalação ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={monthlyEvolution} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="recebidos"
                  name="Recebidos"
                  stackId="1"
                  stroke="hsl(142, 76%, 36%)"
                  fill="hsl(142, 76%, 36%)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="instalados"
                  name="Instalados"
                  stackId="2"
                  stroke="hsl(217, 91%, 60%)"
                  fill="hsl(217, 91%, 60%)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Service Order Stats */}
        <Card>
          <CardHeader>
            <CardTitle translate="no">Estatísticas de Ordens de Serviço</CardTitle>
            <CardDescription>Total de OS e lacres utilizados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{orderStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Total de OS</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{orderStats.sealsPerOrder}</div>
                <p className="text-xs text-muted-foreground">Lacres por OS</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2" translate="no">Itens de Instalação Mais Comuns</h4>
              {orderStats.topItems.length > 0 ? (
                <div className="space-y-2">
                  {orderStats.topItems.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((item.count / (orderStats.topItems[0]?.count || 1)) * 100, 100)}px`,
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                          }} 
                        />
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma instalação registrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle translate="no">Análise Detalhada por Tipo de Lacre</CardTitle>
          <CardDescription>Controle de estoque e utilização por tipo</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead translate="no">Tipo de Lacre</TableHead>
                <TableHead className="text-center" translate="no">Total</TableHead>
                <TableHead className="text-center" translate="no">Disponíveis</TableHead>
                <TableHead className="text-center" translate="no">Instalados</TableHead>
                <TableHead className="text-center" translate="no">Taxa Utilização</TableHead>
                <TableHead className="text-center" translate="no">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeAnalysis.length > 0 ? (
                typeAnalysis.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell className="text-center">{row.total}</TableCell>
                    <TableCell className="text-center text-green-600">{row.available}</TableCell>
                    <TableCell className="text-center text-blue-600">{row.installed}</TableCell>
                    <TableCell className="text-center">{row.utilizationRate}%</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          row.available === 0 ? 'destructive' :
                          row.available < row.total * 0.2 ? 'secondary' :
                          'default'
                        }
                      >
                        {row.available === 0 ? 'Esgotado' :
                         row.available < row.total * 0.2 ? 'Baixo Estoque' :
                         'Normal'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" translate="no">
            <Zap className="h-5 w-5 text-amber-500" />
            Indicadores de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total no Estoque</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <p className="text-sm text-muted-foreground">Disponíveis</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{stats.utilizationRate}%</div>
              <p className="text-sm text-muted-foreground">Taxa de Utilização</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{orderStats.totalOrders}</div>
              <p className="text-sm text-muted-foreground">Ordens de Serviço</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
