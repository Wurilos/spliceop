import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEquipment } from '@/hooks/useEquipment';
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
  Legend,
} from 'recharts';
import { Cpu, Activity, AlertTriangle, CheckCircle, Gauge, Radio } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted))'];

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  maintenance: 'Manutenção',
  decommissioned: 'Desativado',
};

export function EquipmentDashboard() {
  const { equipment } = useEquipment();
  const { contracts } = useContracts();

  // Stats
  const total = equipment.length;
  const active = equipment.filter((e) => e.status === 'active').length;
  const maintenance = equipment.filter((e) => e.status === 'maintenance').length;
  const inactive = equipment.filter((e) => e.status === 'inactive' || e.status === 'decommissioned').length;

  // Equipment by type
  const byType = equipment.reduce((acc, eq) => {
    const type = eq.type || 'Não informado';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(byType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Equipment by contract
  const byContract = equipment.reduce((acc, eq) => {
    const contract = contracts.find((c) => c.id === eq.contract_id);
    const name = contract?.client_name || 'Sem Contrato';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contractData = Object.entries(byContract)
    .map(([name, total]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Equipment by status
  const byStatus = equipment.reduce((acc, eq) => {
    const status = statusLabels[eq.status || 'active'];
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  // Equipment by speed limit
  const bySpeed = equipment.reduce((acc, eq) => {
    const speed = (eq as any).speed_limit;
    if (speed) {
      const label = `${speed} km/h`;
      acc[label] = (acc[label] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const speedData = Object.entries(bySpeed)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));

  // Equipment by communication type
  const byCommunication = equipment.reduce((acc, eq) => {
    const comm = (eq as any).communication_type || 'Não informado';
    acc[comm] = (acc[comm] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commData = Object.entries(byCommunication)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Equipment by energy type
  const byEnergy = equipment.reduce((acc, eq) => {
    const energy = (eq as any).energy_type || 'Não informado';
    acc[energy] = (acc[energy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const energyData = Object.entries(byEnergy)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Equipment by brand
  const byBrand = equipment.reduce((acc, eq) => {
    const brand = eq.brand || 'Não informado';
    acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const brandData = Object.entries(byBrand)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Total</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">equipamentos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{active}</div>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? ((active / total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Em Manutenção</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{maintenance}</div>
            <p className="text-xs text-muted-foreground">aguardando reparo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Inativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactive}</div>
            <p className="text-xs text-muted-foreground">desativados ou inativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle translate="no">Equipamentos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle translate="no">Equipamentos por Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contractData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle translate="no">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" translate="no">
              <Gauge className="h-4 w-4" />
              Por Velocidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle translate="no">Por Marca</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={brandData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {brandData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" translate="no">
              <Radio className="h-4 w-4" />
              Por Meio de Comunicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={commData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle translate="no">Por Tipo de Energia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={energyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
