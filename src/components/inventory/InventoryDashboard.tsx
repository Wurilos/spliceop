import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Package, Wrench, Boxes, TrendingUp } from 'lucide-react';
import { useComponents } from '@/hooks/useComponents';
import { useStock } from '@/hooks/useStock';
import { useStockMaintenance } from '@/hooks/useStockMaintenance';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function InventoryDashboard() {
  const { components } = useComponents();
  const { items: stockItems } = useStock();
  const { items: maintenanceItems } = useStockMaintenance();

  // Calculate totals
  const totalStock = useMemo(() => {
    return stockItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [stockItems]);

  const totalInMaintenance = useMemo(() => {
    return maintenanceItems
      .filter(m => m.status === 'em_manutencao')
      .reduce((sum, m) => {
        return sum + (m.stock_maintenance_items?.reduce((s, i) => s + i.quantity, 0) || 0);
      }, 0);
  }, [maintenanceItems]);

  // Materials by type
  const materialsByType = useMemo(() => {
    const typeMap: Record<string, number> = {};
    components.forEach(comp => {
      const type = comp.type || 'Sem tipo';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  }, [components]);

  // Stock vs Maintenance comparison by component
  const stockVsMaintenanceData = useMemo(() => {
    const componentMap: Record<string, { name: string; stock: number; maintenance: number }> = {};

    // Add stock quantities
    stockItems.forEach(item => {
      const compName = item.components?.name || 'Desconhecido';
      if (!componentMap[item.component_id]) {
        componentMap[item.component_id] = { name: compName, stock: 0, maintenance: 0 };
      }
      componentMap[item.component_id].stock += item.quantity || 0;
    });

    // Add maintenance quantities
    maintenanceItems
      .filter(m => m.status === 'em_manutencao')
      .forEach(m => {
        m.stock_maintenance_items?.forEach(item => {
          const comp = components.find(c => c.id === item.component_id);
          const compName = comp?.name || item.components?.name || 'Desconhecido';
          if (!componentMap[item.component_id]) {
            componentMap[item.component_id] = { name: compName, stock: 0, maintenance: 0 };
          }
          componentMap[item.component_id].maintenance += item.quantity;
        });
      });

    return Object.values(componentMap).slice(0, 10);
  }, [stockItems, maintenanceItems, components]);

  const chartConfig = {
    stock: { label: 'Em Estoque', color: 'hsl(var(--primary))' },
    maintenance: { label: 'Em Manutenção', color: 'hsl(var(--destructive))' },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Componentes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{components.length}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Estoque</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalStock}</div>
            <p className="text-xs text-muted-foreground">Unidades disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalInMaintenance}</div>
            <p className="text-xs text-muted-foreground">Unidades em reparo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros de Manutenção</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceItems.length}</div>
            <p className="text-xs text-muted-foreground">Total de registros</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materials by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {materialsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {materialsByType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum componente cadastrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock vs Maintenance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque vs Manutenção por Componente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stockVsMaintenanceData.length > 0 ? (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockVsMaintenanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="stock" name="Em Estoque" fill="hsl(var(--primary))" />
                      <Bar dataKey="maintenance" name="Em Manutenção" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
