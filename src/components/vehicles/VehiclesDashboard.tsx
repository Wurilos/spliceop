import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Vehicle {
  id: string;
  model: string | null;
  fuel_type: string | null;
  ownership: string | null;
  status: string | null;
}

interface VehiclesDashboardProps {
  vehicles: Vehicle[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const getStatusLabel = (status: string | null) => {
  switch (status) {
    case 'active': return 'Em Uso';
    case 'inactive': return 'Inativo';
    case 'maintenance': return 'Manutenção';
    default: return status || 'Não definido';
  }
};

const getOwnershipLabel = (ownership: string | null) => {
  return ownership || 'Não definido';
};

export function VehiclesDashboard({ vehicles }: VehiclesDashboardProps) {
  const stats = useMemo(() => {
    const byModel: Record<string, number> = {};
    const byFuelType: Record<string, number> = {};
    const byOwnership: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    vehicles.forEach((v) => {
      const model = v.model || 'Não definido';
      const fuelType = v.fuel_type || 'Não definido';
      const ownership = getOwnershipLabel(v.ownership);
      const status = getStatusLabel(v.status);

      byModel[model] = (byModel[model] || 0) + 1;
      byFuelType[fuelType] = (byFuelType[fuelType] || 0) + 1;
      byOwnership[ownership] = (byOwnership[ownership] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      byModel: Object.entries(byModel)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      byFuelType: Object.entries(byFuelType).map(([name, value]) => ({ name, value })),
      byOwnership: Object.entries(byOwnership).map(([name, value]) => ({ name, value })),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    };
  }, [vehicles]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Total de Veículos por Modelo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Veículos por Modelo (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byModel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Total de Veículos por Combustível */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Veículos por Combustível</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byFuelType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.byFuelType.map((_, index) => (
                    <Cell key={`cell-fuel-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Total de Veículos por Titularidade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Veículos por Titularidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byOwnership}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.byOwnership.map((_, index) => (
                    <Cell key={`cell-ownership-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Total de Veículos por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Veículos por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.byStatus.map((_, index) => (
                    <Cell key={`cell-status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
